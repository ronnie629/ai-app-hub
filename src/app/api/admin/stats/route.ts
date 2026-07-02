import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const period = url.searchParams.get("period") || "7d"; // 7d, 30d, all

    let dateFrom: Date;
    if (period === "30d") {
      dateFrom = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    } else if (period === "all") {
      dateFrom = new Date(0);
    } else {
      dateFrom = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    }

    // Parallel data fetching
    const [
      totalUsers,
      totalApps,
      approvedApps,
      pendingApps,
      totalPurchases,
      platformRevenue,
      newUsersInPeriod,
      recentUsers,
      purchasesByDay,
      appsByCategory,
      topApps,
    ] = await Promise.all([
      // Basic counts
      prisma.user.count(),
      prisma.app.count(),
      prisma.app.count({ where: { status: "APPROVED" } }),
      prisma.app.count({ where: { status: "PENDING" } }),
      prisma.purchase.count(),
      prisma.purchase.aggregate({ _sum: { platformEarning: true } }),

      // New users in period
      prisma.user.count({ where: { createdAt: { gte: dateFrom } } }),

      // Recent users (last 10)
      prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true, name: true, email: true, role: true, points: true,
          createdAt: true, lastLoginAt: true, isDeveloper: true,
        },
      }),

      // Daily purchases in period
      prisma.purchase.groupBy({
        by: ["createdAt"],
        _count: true,
        _sum: { pointsCost: true },
        where: { createdAt: { gte: dateFrom } },
        orderBy: { createdAt: "asc" },
      }),

      // Apps by category
      prisma.app.groupBy({
        by: ["category"],
        _count: true,
        where: { status: "APPROVED" },
      }),

      // Top apps by purchase count (use subquery via Purchase relation)
      prisma.app.findMany({
        where: { status: "APPROVED" },
        orderBy: { downloadCount: "desc" },
        take: 10,
        include: {
          _count: { select: { purchases: true } },
        },
      }),
    ]);

    // Process daily purchase data
    const dailyData: Record<string, { purchases: number; revenue: number }> = {};
    const dayMs = 24 * 60 * 60 * 1000;
    for (let i = 0; i <= 29; i++) {
      const d = new Date(dateFrom.getTime() + i * dayMs);
      const key = d.toISOString().split("T")[0];
      dailyData[key] = { purchases: 0, revenue: 0 };
    }
    for (const p of purchasesByDay) {
      const key = p.createdAt.toISOString().split("T")[0];
      if (dailyData[key]) {
        dailyData[key].purchases += p._count;
        dailyData[key].revenue += p._sum.pointsCost || 0;
      }
    }

    const chartData = Object.entries(dailyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, data]) => ({
        date: date.slice(5).replace("-", "/"),
        label: date,
        purchases: data.purchases,
        revenue: data.revenue,
      }));

    return NextResponse.json({
      stats: {
        totalUsers,
        totalApps,
        approvedApps,
        pendingApps,
        totalPurchases,
        platformRevenue: platformRevenue._sum.platformEarning || 0,
        newUsersInPeriod,
      },
      chartData,
      appsByCategory: appsByCategory.map((c) => ({ category: c.category, count: c._count })),
      topApps,
      recentUsers,
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

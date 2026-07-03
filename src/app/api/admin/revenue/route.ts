import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

// GET: Platform commission detail list
export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const pageSize = parseInt(url.searchParams.get("pageSize") || "20");
    const search = url.searchParams.get("search") || "";

    const where = search
      ? {
          OR: [
            { app: { title: { contains: search, mode: "insensitive" as const } } },
            { user: { name: { contains: search, mode: "insensitive" as const } } },
            { app: { developer: { name: { contains: search, mode: "insensitive" as const } } } },
          ],
        }
      : {};

    const [purchases, total] = await Promise.all([
      prisma.purchase.findMany({
        where,
        include: {
          app: {
            select: {
              id: true,
              title: true,
              developerId: true,
              developer: {
                select: { id: true, name: true, email: true, avatar: true },
              },
            },
          },
          user: {
            select: { id: true, name: true, email: true, avatar: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.purchase.count({ where }),
    ]);

    // Aggregate stats
    const agg = await prisma.purchase.aggregate({
      _sum: { platformEarning: true, pointsCost: true, developerEarning: true },
      _count: true,
    });

    const records = purchases.map(p => ({
      id: p.id,
      appId: p.app.id,
      appTitle: p.app.title,
      developerId: p.app.developer.id,
      developerName: p.app.developer.name,
      buyerId: p.user.id,
      buyerName: p.user.name,
      pointsCost: p.pointsCost,
      platformFeeRate: p.platformFeeRate,
      platformEarning: p.platformEarning,
      developerEarning: p.developerEarning,
      purchaseType: p.purchaseType,
      createdAt: p.createdAt.toISOString(),
    }));

    // 拿最近 12 个月所有成交（仅必要字段），用于趋势图
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
    twelveMonthsAgo.setDate(1);
    twelveMonthsAgo.setHours(0, 0, 0, 0);
    const trendPurchases = await prisma.purchase.findMany({
      where: { createdAt: { gte: twelveMonthsAgo } },
      select: { createdAt: true, pointsCost: true, platformEarning: true, developerEarning: true },
    });

    return NextResponse.json({
      records,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      summary: {
        totalRevenue: agg._sum.platformEarning || 0,
        totalPoints: agg._sum.pointsCost || 0,
        totalDevEarning: agg._sum.developerEarning || 0,
        totalTransactions: agg._count,
      },
      monthlyTrend: buildMonthlyTrend(trendPurchases),
    });
  } catch (error) {
    console.error("Admin revenue error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// 按月聚合最近 12 个月数据
async function buildMonthlyTrend(purchases: { createdAt: Date; pointsCost: number; platformEarning: number; developerEarning: number }[]) {
  const buckets: Record<string, { month: string; platformEarning: number; totalPoints: number; devEarning: number; count: number }> = {};
  const now = new Date();
  // 预生成最近 12 个月的 key
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    buckets[key] = { month: key, platformEarning: 0, totalPoints: 0, devEarning: 0, count: 0 };
  }
  for (const p of purchases) {
    const key = `${p.createdAt.getFullYear()}-${String(p.createdAt.getMonth() + 1).padStart(2, "0")}`;
    if (!buckets[key]) continue;
    buckets[key].platformEarning += p.platformEarning || 0;
    buckets[key].totalPoints += p.pointsCost || 0;
    buckets[key].devEarning += p.developerEarning || 0;
    buckets[key].count += 1;
  }
  return Object.values(buckets);
}

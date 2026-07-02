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
    });
  } catch (error) {
    console.error("Admin revenue error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

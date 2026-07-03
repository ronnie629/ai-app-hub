import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { computeUserStats, matchLevel, type UserLevelConfig } from "@/lib/user-level";

/**
 * 实时预览：给定一组等级配置，统计各等级用户分布
 * POST /api/admin/levels/preview
 * body: { userType: "USER"|"DEVELOPER", levels: LevelConfig[] }
 * 返回: { stats: { level: 1, count: 12, sample: [...] }, total: 50 }
 */
export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { userType, levels } = body as {
      userType: "USER" | "DEVELOPER";
      levels: UserLevelConfig[];
    };

    if (!userType || !Array.isArray(levels) || levels.length === 0) {
      return NextResponse.json({ error: "参数错误" }, { status: 400 });
    }

    // 排序按 level
    const sortedLevels = [...levels].sort((a, b) => a.level - b.level);

    // 查询所有目标用户
    const users = await prisma.user.findMany({
      where: userType === "DEVELOPER" ? { isDeveloper: true } : {},
      select: {
        id: true,
        name: true,
        lastPurchaseAt: true,
        createdAt: true,
      },
    });

    // 批量计算统计
    const userIds = users.map((u) => u.id);
    const consumptionMap = new Map<string, number>();
    const appsMap = new Map<string, number>();
    const earningsMap = new Map<string, number>();

    if (userType === "USER") {
      // 一次查询所有用户的累计消费
      const groups = await prisma.purchase.groupBy({
        by: ["userId"],
        _sum: { pointsCost: true },
        where: { userId: { in: userIds } },
      });
      for (const g of groups) {
        consumptionMap.set(g.userId, g._sum.pointsCost || 0);
      }
    } else {
      // 开发者：批量查 app 数和 earnings
      const [appGroups, earningGroups] = await Promise.all([
        prisma.app.groupBy({
          by: ["developerId"],
          _count: { id: true },
          where: { developerId: { in: userIds }, status: { not: "REJECTED" } },
        }),
        prisma.purchase.groupBy({
          by: ["appId"],
          _sum: { developerEarning: true },
          where: { app: { developerId: { in: userIds } } },
        }),
      ]);
      for (const g of appGroups) {
        appsMap.set(g.developerId, g._count.id);
      }
      // 关联 app.developerId
      const apps = await prisma.app.findMany({
        where: { developerId: { in: userIds } },
        select: { id: true, developerId: true },
      });
      const appToDev = new Map(apps.map((a) => [a.id, a.developerId]));
      for (const g of earningGroups) {
        const devId = appToDev.get(g.appId);
        if (devId) {
          earningsMap.set(devId, (earningsMap.get(devId) || 0) + (g._sum.developerEarning || 0));
        }
      }
    }

    // 计算每个用户的等级
    const levelCounts: Record<number, { count: number; samples: Array<{ id: string; name: string; stat: number }> }> = {};
    for (const lv of sortedLevels) {
      levelCounts[lv.level] = { count: 0, samples: [] };
    }

    let downgradeCount = 0;
    for (const u of users) {
      const stats = {
        consumption: consumptionMap.get(u.id) || 0,
        apps: appsMap.get(u.id) || 0,
        earnings: earningsMap.get(u.id) || 0,
      };
      let level = matchLevel(sortedLevels, stats, userType);

      // 90 天无消费降级
      if (userType === "USER" && u.lastPurchaseAt) {
        const days = (Date.now() - u.lastPurchaseAt.getTime()) / (1000 * 60 * 60 * 24);
        if (days > 90) {
          level = Math.max(1, level - 1);
          downgradeCount++;
        }
      }

      const bucket = levelCounts[level] || (levelCounts[level] = { count: 0, samples: [] });
      bucket.count++;
      if (bucket.samples.length < 3) {
        const stat = userType === "USER" ? stats.consumption : stats.apps;
        bucket.samples.push({ id: u.id, name: u.name, stat });
      }
    }

    return NextResponse.json({
      total: users.length,
      downgradeCount,
      distribution: sortedLevels.map((lv) => ({
        level: lv.level,
        name: lv.name,
        count: levelCounts[lv.level]?.count || 0,
        samples: levelCounts[lv.level]?.samples || [],
      })),
    });
  } catch (error) {
    console.error("Level preview error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

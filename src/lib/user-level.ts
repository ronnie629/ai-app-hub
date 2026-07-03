import { prisma } from "@/lib/prisma";

export interface UserLevelConfig {
  id: string;
  userType: "USER" | "DEVELOPER";
  level: number;
  name: string;
  minConsumption: number;
  minApps: number;
  minEarnings: number;
  devShareRate: number;
  color: string;
  icon: string;
}

export interface UserLevelStats {
  consumption: number; // USER: 累计消费积分
  apps: number;        // DEVELOPER: 发布应用数
  earnings: number;    // DEVELOPER: 累计赚取积分
}

/**
 * 计算并返回用户的当前等级
 * @param userId 用户 ID
 * @param userType "USER" | "DEVELOPER"
 * @returns 等级 level (1/2/3)，未匹配返回 1
 */
export async function getUserCurrentLevel(
  userId: string,
  userType: "USER" | "DEVELOPER"
): Promise<number> {
  const levels = (await prisma.userLevel.findMany({
    where: { userType },
    orderBy: { level: "asc" },
  })) as unknown as UserLevelConfig[];
  if (levels.length === 0) return 1;

  // 计算统计指标
  const stats = await computeUserStats(userId, userType);

  // 降级判定：USER 连续 90 天无消费 → 降一级（最低 1 级）
  if (userType === "USER") {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { lastPurchaseAt: true },
    });
    if (user?.lastPurchaseAt) {
      const daysSinceLast =
        (Date.now() - user.lastPurchaseAt.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceLast > 90) {
        const rawLevel = matchLevel(levels, stats, userType);
        return Math.max(1, rawLevel - 1);
      }
    }
  }

  return matchLevel(levels, stats, userType);
}

export async function computeUserStats(
  userId: string,
  userType: "USER" | "DEVELOPER"
): Promise<UserLevelStats> {
  if (userType === "USER") {
    // 消费积分 = 买断 + 按次都算
    const agg = await prisma.purchase.aggregate({
      where: { userId },
      _sum: { pointsCost: true },
    });
    return { consumption: agg._sum.pointsCost || 0, apps: 0, earnings: 0 };
  } else {
    const [appCount, earningAgg] = await Promise.all([
      // 已下架（REJECTED）应用不计入
      prisma.app.count({
        where: { developerId: userId, status: { not: "REJECTED" } },
      }),
      prisma.purchase.aggregate({
        where: { app: { developerId: userId } },
        _sum: { developerEarning: true },
      }),
    ]);
    return {
      consumption: 0,
      apps: appCount,
      earnings: earningAgg._sum.developerEarning || 0,
    };
  }
}

/**
 * 从高到低匹配等级
 * USER: 单维度（消费积分）
 * DEVELOPER: 双维度（应用数 + 赚取积分都需达标）
 */
export function matchLevel(
  levels: UserLevelConfig[],
  stats: UserLevelStats,
  userType: "USER" | "DEVELOPER"
): number {
  if (userType === "USER") {
    for (let i = levels.length - 1; i >= 0; i--) {
      if (stats.consumption >= levels[i].minConsumption) {
        return levels[i].level;
      }
    }
  } else {
    for (let i = levels.length - 1; i >= 0; i--) {
      const lv = levels[i];
      if (stats.apps >= lv.minApps && stats.earnings >= lv.minEarnings) {
        return lv.level;
      }
    }
  }
  return 1;
}

/**
 * 获取开发者当前等级对应的分润比例（带降级保护）
 * 降级保护：当月按 devLevelSnapshot 算，下月 1 号重置
 */
export async function getDeveloperShareRate(developerId: string): Promise<{
  rate: number;
  platformFeeRate: number;
  level: number;
  isProtected: boolean;
}> {
  const levels = (await prisma.userLevel.findMany({
    where: { userType: "DEVELOPER" },
    orderBy: { level: "asc" },
  })) as unknown as UserLevelConfig[];

  if (levels.length === 0) {
    return { rate: 0.9, platformFeeRate: 0.1, level: 1, isProtected: false };
  }

  // 计算真实等级
  const stats = await computeUserStats(developerId, "DEVELOPER");
  const realLevel = matchLevel(levels, stats, "DEVELOPER");

  // 获取开发者当前快照
  const user = await prisma.user.findUnique({
    where: { id: developerId },
    select: {
      devLevelSnapshot: true,
      devLevelSnapshotMonth: true,
    },
  });

  const currentMonth = new Date().toISOString().slice(0, 7); // "YYYY-MM"
  const snapshot = user?.devLevelSnapshot || 1;
  const snapshotMonth = user?.devLevelSnapshotMonth;

  let effectiveLevel = realLevel;
  let isProtected = false;

  if (snapshotMonth === currentMonth && snapshot > realLevel) {
    // 本月内，保护期生效：使用上月快照（更高等级）
    effectiveLevel = snapshot;
    isProtected = true;
  }

  // 找到对应配置
  const config = levels.find((lv) => lv.level === effectiveLevel) || levels[0];
  return {
    rate: config.devShareRate,
    platformFeeRate: 1 - config.devShareRate,
    level: effectiveLevel,
    isProtected,
  };
}

/**
 * 触发等级快照更新：每月 1 号调用或购买时检测
 * 规则：
 * - 降级时，立即同步快照（保护当月）
 * - 跨月时，清空快照
 */
export async function refreshLevelSnapshot(developerId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: developerId },
    select: {
      devLevelSnapshot: true,
      devLevelSnapshotMonth: true,
    },
  });
  if (!user) return;

  const currentMonth = new Date().toISOString().slice(0, 7);
  const snapshotMonth = user.devLevelSnapshotMonth;

  if (snapshotMonth !== currentMonth) {
    // 跨月：清空快照，让 getDeveloperShareRate 重新计算
    await prisma.user.update({
      where: { id: developerId },
      data: {
        devLevelSnapshot: 1,
        devLevelSnapshotMonth: currentMonth,
      },
    });
  }
}

import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { formatPoints, formatDate, timeAgo, CATEGORIES } from "@/lib/constants";
import { AppCard } from "@/components/app-card";

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      bio: true,
      avatar: true,
      role: true,
      isDeveloper: true,
      profession: true,
      workYears: true,
      interests: true,
      appDomains: true,
      points: true,
      createdAt: true,
      lastLoginAt: true,
    },
  });

  if (!user) {
    notFound();
  }

  // Get user's apps (if developer)
  const apps = await prisma.app.findMany({
    where: { developerId: id, status: "APPROVED" },
    orderBy: { downloadCount: "desc" },
  });

  // Get purchase count and total spent
  const purchaseAgg = await prisma.purchase.aggregate({
    where: { userId: id },
    _sum: { pointsCost: true },
    _count: true,
  });

  // Get earning (if developer)
  const earningAgg = await prisma.purchase.aggregate({
    where: { app: { developerId: id } },
    _sum: { developerEarning: true },
    _count: true,
  });

  // Get user level
  let userLevel = null;
  if (user.isDeveloper || user.role === "DEVELOPER" || apps.length > 0) {
    const devLevels = await prisma.userLevel.findMany({
      where: { userType: "DEVELOPER" },
      orderBy: { level: "asc" },
    });
    if (devLevels.length > 0) {
      const totalEarnings = earningAgg._sum.developerEarning || 0;
      let matched = devLevels[0];
      for (const lv of [...devLevels].reverse()) {
        if (apps.length >= lv.minApps && totalEarnings >= lv.minEarnings) {
          matched = lv;
          break;
        }
      }
      userLevel = { ...matched, type: "DEVELOPER" };
    }
  } else {
    const userLevels = await prisma.userLevel.findMany({
      where: { userType: "USER" },
      orderBy: { level: "asc" },
    });
    if (userLevels.length > 0) {
      const totalSpent = purchaseAgg._sum.pointsCost || 0;
      let matched = userLevels[0];
      for (const lv of [...userLevels].reverse()) {
        if (totalSpent >= lv.minConsumption) {
          matched = lv;
          break;
        }
      }
      userLevel = { ...matched, type: "USER" };
    }
  }

  const isDev = user.isDeveloper || user.role === "DEVELOPER" || apps.length > 0;

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Profile header */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 mb-6">
        <div className="flex items-start gap-5">
          {/* Avatar */}
          <div className="flex-shrink-0 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 text-white text-3xl font-bold">
            {user.name.charAt(0).toUpperCase()}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold">{user.name}</h1>
              {userLevel && (
                <span
                  className="rounded-full px-3 py-0.5 text-xs font-medium"
                  style={{ backgroundColor: userLevel.color + "20", color: userLevel.color }}
                >
                  {userLevel.icon} {userLevel.name}
                </span>
              )}
              {isDev && (
                <span className="rounded-full bg-indigo-50 px-3 py-0.5 text-xs font-medium text-indigo-600">
                  🚀 开发者
                </span>
              )}
            </div>

            {user.bio && (
              <p className="mt-2 text-sm text-gray-600">{user.bio}</p>
            )}

            <div className="mt-3 flex flex-wrap gap-4 text-xs text-gray-400">
              {user.profession && <span>职业：{user.profession}</span>}
              {user.workYears != null && <span>工作年限：{user.workYears} 年</span>}
              <span>注册于 {formatDate(user.createdAt)}</span>
              {user.lastLoginAt && <span>最近活跃 {timeAgo(user.lastLoginAt)}</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 p-5 text-white">
          <p className="text-amber-100 text-sm">当前积分</p>
          <p className="text-2xl font-bold mt-1">⚡ {formatPoints(user.points)}</p>
        </div>
        {isDev ? (
          <>
            <div className="rounded-2xl bg-gradient-to-br from-green-400 to-emerald-500 p-5 text-white">
              <p className="text-green-100 text-sm">累计收入</p>
              <p className="text-2xl font-bold mt-1">⚡ {formatPoints(earningAgg._sum.developerEarning || 0)}</p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-5">
              <p className="text-gray-400 text-sm">发布应用</p>
              <p className="text-2xl font-bold mt-1">{apps.length}</p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-5">
              <p className="text-gray-400 text-sm">总销售次数</p>
              <p className="text-2xl font-bold mt-1">{earningAgg._count}</p>
            </div>
          </>
        ) : (
          <>
            <div className="rounded-2xl border border-gray-200 bg-white p-5">
              <p className="text-gray-400 text-sm">购买应用数</p>
              <p className="text-2xl font-bold mt-1">{purchaseAgg._count}</p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-5">
              <p className="text-gray-400 text-sm">总消费积分</p>
              <p className="text-2xl font-bold mt-1">⚡ {formatPoints(purchaseAgg._sum.pointsCost || 0)}</p>
            </div>
          </>
        )}
      </div>

      {/* Developer apps */}
      {isDev && apps.length > 0 && (
        <div>
          <h2 className="text-lg font-bold mb-4">发布的应用</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {apps.map((app) => (
              <AppCard
                key={app.id}
                app={{
                  ...app,
                  developer: { name: user.name },
                }}
              />
            ))}
          </div>
        </div>
      )}

      <div className="mt-8 text-center">
        <Link href="/market" className="text-sm text-indigo-600 hover:underline">
          ← 返回应用市场
        </Link>
      </div>
    </div>
  );
}

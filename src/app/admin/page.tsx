import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AdminNav } from "@/components/admin-nav";
import { formatPoints, formatDate } from "@/lib/constants";

export default async function AdminPage() {
  const session = await getSession();
  if (!session) redirect("/login?redirect=/admin");
  if (session.role !== "ADMIN") redirect("/dashboard");

  const [
    totalUsers,
    totalApps,
    pendingApps,
    approvedApps,
    totalPurchases,
    totalRevenue,
    platformRevenue,
    recentUsers,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.app.count(),
    prisma.app.count({ where: { status: "PENDING" } }),
    prisma.app.count({ where: { status: "APPROVED" } }),
    prisma.purchase.count(),
    prisma.purchase.aggregate({ _sum: { pointsCost: true } }),
    prisma.purchase.aggregate({ _sum: { platformEarning: true } }),
    prisma.user.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-8">
        <AdminNav active="overview" />
        <div>
          <h1 className="text-2xl font-bold mb-6">管理后台</h1>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="rounded-2xl border border-gray-200 bg-white p-5">
              <p className="text-sm text-gray-400">总用户数</p>
              <p className="text-2xl font-bold mt-1">{totalUsers}</p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-5">
              <p className="text-sm text-gray-400">待审核应用</p>
              <p className="text-2xl font-bold mt-1 text-amber-600">{pendingApps}</p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-5">
              <p className="text-sm text-gray-400">已上架应用</p>
              <p className="text-2xl font-bold mt-1 text-green-600">{approvedApps}</p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-5">
              <p className="text-sm text-gray-400">平台收入</p>
              <p className="text-2xl font-bold mt-1 text-indigo-600">⚡{formatPoints(platformRevenue._sum.platformEarning || 0)}</p>
            </div>
          </div>

          {/* Pending apps alert */}
          {pendingApps > 0 && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-amber-700 font-medium">有 {pendingApps} 个应用等待审核</span>
                  <p className="text-amber-600 text-sm mt-1">及时审核可以提升开发者活跃度</p>
                </div>
                <a href="/admin/apps" className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600">
                  去审核
                </a>
              </div>
            </div>
          )}

          {/* Recent users */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <h2 className="font-bold mb-4">最近注册用户</h2>
            <div className="space-y-3">
              {recentUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 text-white text-sm font-medium">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-700">{user.name}</span>
                      <span className="ml-2 text-xs text-gray-400">{user.email}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-400">{formatDate(user.createdAt)}</span>
                    <span className="text-xs text-amber-600">⚡{user.points}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

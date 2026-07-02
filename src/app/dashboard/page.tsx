import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DashboardNav } from "@/components/dashboard-nav";
import { formatPoints, formatDate } from "@/lib/constants";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login?redirect=/dashboard");

  const [myApps, myPurchases, earnings, spending] = await Promise.all([
    prisma.app.count({ where: { developerId: session.id } }),
    prisma.purchase.count({ where: { userId: session.id } }),
    prisma.purchase.aggregate({
      where: { app: { developerId: session.id } },
      _sum: { developerEarning: true },
    }),
    prisma.purchase.aggregate({
      where: { userId: session.id },
      _sum: { pointsCost: true },
    }),
  ]);

  const recentTransactions = await prisma.pointsTransaction.findMany({
    where: { userId: session.id },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-8">
        <DashboardNav active="overview" role={session.role} />

        <div>
          <h1 className="text-2xl font-bold mb-6">控制台</h1>

          {/* Stats cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="rounded-2xl border border-gray-200 bg-white p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">我的积分</span>
                <span className="text-amber-500">⚡</span>
              </div>
              <div className="text-2xl font-bold">{formatPoints(session.points)}</div>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">发布应用</span>
                <span className="text-indigo-500">📦</span>
              </div>
              <div className="text-2xl font-bold">{myApps}</div>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">累计收入</span>
                <span className="text-green-500">💰</span>
              </div>
              <div className="text-2xl font-bold text-green-600">
                ⚡{formatPoints(earnings._sum.developerEarning || 0)}
              </div>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">已购应用</span>
                <span className="text-purple-500">🛒</span>
              </div>
              <div className="text-2xl font-bold">{myPurchases}</div>
            </div>
          </div>

          {/* Recent transactions */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <h2 className="font-bold mb-4">最近交易</h2>
            {recentTransactions.length === 0 ? (
              <p className="text-gray-400 text-sm py-6 text-center">暂无交易记录</p>
            ) : (
              <div className="space-y-3">
                {recentTransactions.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <div>
                      <span className="text-sm font-medium text-gray-700">{tx.description}</span>
                      <span className="ml-2 text-xs text-gray-400">{formatDate(tx.createdAt)}</span>
                    </div>
                    <span className={`text-sm font-semibold ${tx.amount > 0 ? "text-green-600" : "text-red-500"}`}>
                      {tx.amount > 0 ? "+" : ""}{tx.amount} ⚡
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DashboardNav } from "@/components/dashboard-nav";
import { formatPoints, formatDate } from "@/lib/constants";

export default async function DashboardEarningsPage() {
  const session = await getSession();
  if (!session) redirect("/login?redirect=/dashboard/earnings");

  const purchases = await prisma.purchase.findMany({
    where: { app: { developerId: session.id } },
    include: { app: true },
    orderBy: { createdAt: "desc" },
  });

  const totalEarnings = purchases.reduce((sum, p) => sum + p.developerEarning, 0);
  const totalSales = purchases.length;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-8">
        <DashboardNav active="earnings" role={session.role} />
        <div>
          <h1 className="text-2xl font-bold mb-6">收入记录</h1>

          {/* Summary */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="rounded-2xl bg-gradient-to-br from-green-400 to-emerald-500 p-5 text-white">
              <p className="text-green-100 text-sm">累计收入</p>
              <p className="text-3xl font-bold mt-1">⚡ {formatPoints(totalEarnings)}</p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-5">
              <p className="text-gray-400 text-sm">总销售次数</p>
              <p className="text-3xl font-bold mt-1">{totalSales}</p>
            </div>
          </div>

          {/* Records */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <h2 className="font-bold mb-4">交易明细</h2>
            {purchases.length === 0 ? (
              <p className="text-gray-400 text-sm py-6 text-center">
                还没有收入记录，快去发布应用吧！
              </p>
            ) : (
              <div className="space-y-3">
                {purchases.map((p) => (
                  <div key={p.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <div>
                      <span className="text-sm font-medium text-gray-700">{p.app.title}</span>
                      <span className="ml-2 text-xs text-gray-400">{formatDate(p.createdAt)}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-green-600">+{p.developerEarning} ⚡</div>
                      <div className="text-xs text-gray-400">售价 {p.pointsCost}</div>
                    </div>
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

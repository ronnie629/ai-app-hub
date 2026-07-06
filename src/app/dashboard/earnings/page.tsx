import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DashboardNav } from "@/components/dashboard-nav";
import { formatPoints, formatDate } from "@/lib/constants";

export default async function DashboardEarningsPage() {
  const session = await getSession();
  if (!session) redirect("/login?redirect=/dashboard/earnings");

  const transactions = await prisma.pointsTransaction.findMany({
    where: { userId: session.id, type: "EARNING" },
    include: {
      relatedPurchase: { include: { app: true } },
      consumer: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const totalEarnings = transactions.reduce((sum, t) => sum + t.amount, 0);
  const totalSales = transactions.length;

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
            {transactions.length === 0 ? (
              <p className="text-gray-400 text-sm py-6 text-center">
                还没有收入记录，快去发布应用吧！
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-400 border-b border-gray-100">
                      <th className="pb-3 font-medium">时间</th>
                      <th className="pb-3 font-medium">应用名称</th>
                      <th className="pb-3 font-medium">购买者</th>
                      <th className="pb-3 font-medium">付费方式</th>
                      <th className="pb-3 font-medium text-right">消费积分</th>
                      <th className="pb-3 font-medium text-right">我的收入</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {transactions.map((t) => (
                      <tr key={t.id}>
                        <td className="py-3 text-gray-500">{formatDate(t.createdAt)}</td>
                        <td className="py-3 font-medium text-gray-800">
                          {t.relatedPurchase?.app?.title ?? "-"}
                        </td>
                        <td className="py-3 text-gray-600">
                          {t.consumer?.name ?? t.consumer?.email ?? "-"}
                        </td>
                        <td className="py-3">
                          <span className="inline-flex rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-600">
                            {t.relatedPurchase?.purchaseType === "PER_USE" ? "按次" : "买断"}
                          </span>
                        </td>
                        <td className="py-3 text-right text-gray-600">
                          {t.purchaseAmount ?? t.relatedPurchase?.pointsCost ?? 0}
                        </td>
                        <td className="py-3 text-right font-semibold text-green-600">
                          +{t.amount} ⚡
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

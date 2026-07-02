import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AdminNav } from "@/components/admin-nav";
import { AdminAnalytics } from "@/components/admin-analytics";
import { formatPoints } from "@/lib/constants";

export default async function AdminPage() {
  const session = await getSession();
  if (!session) redirect("/login?redirect=/admin");
  if (session.role !== "ADMIN") redirect("/dashboard");

  const [pendingApps, approvedApps] = await Promise.all([
    prisma.app.count({ where: { status: "PENDING" } }),
    prisma.app.count({ where: { status: "APPROVED" } }),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-8">
        <AdminNav active="overview" />
        <div>
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">管理后台</h1>
            {pendingApps > 0 && (
              <div className="flex items-center gap-2 rounded-full bg-amber-50 border border-amber-200 px-4 py-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                <span className="text-sm text-amber-700 font-medium">
                  {pendingApps} 个应用待审核
                </span>
                <a href="/admin/apps" className="text-xs text-amber-600 hover:underline ml-1">去处理 →</a>
              </div>
            )}
          </div>

          {/* Analytics dashboard */}
          <AdminAnalytics />
        </div>
      </div>
    </div>
  );
}

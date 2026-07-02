import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DashboardNav } from "@/components/dashboard-nav";
import { APP_STATUS, formatPoints, formatDate } from "@/lib/constants";
import Link from "next/link";

export default async function DashboardAppsPage() {
  const session = await getSession();
  if (!session) redirect("/login?redirect=/dashboard/apps");

  const apps = await prisma.app.findMany({
    where: { developerId: session.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-8">
        <DashboardNav active="apps" role={session.role} />
        <div>
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">我的应用</h1>
            <Link
              href="/publish"
              className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              + 发布新应用
            </Link>
          </div>

          {apps.length === 0 ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center">
              <span className="text-4xl block mb-4">📦</span>
              <h3 className="text-lg font-semibold text-gray-700">还没有发布任何应用</h3>
              <p className="text-gray-400 mt-2 mb-6">把你的 AI 应用分享给更多用户</p>
              <Link
                href="/publish"
                className="inline-flex items-center rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                立即发布
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {apps.map((app) => {
                const status = APP_STATUS[app.status as keyof typeof APP_STATUS];
                return (
                  <div key={app.id} className="rounded-2xl border border-gray-200 bg-white p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <Link href={`/app/${app.id}`} className="font-semibold text-gray-900 hover:text-indigo-600">
                            {app.title}
                          </Link>
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${status?.color || "text-gray-600 bg-gray-50"}`}>
                            {status?.label || app.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 line-clamp-1">{app.description}</p>
                        <div className="mt-2 flex items-center gap-4 text-xs text-gray-400">
                          <span>⬇ {app.downloadCount}</span>
                          <span>⚡ {app.price === 0 ? "免费" : formatPoints(app.price)}</span>
                          <span>{formatDate(app.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

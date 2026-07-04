import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AdminNav } from "@/components/admin-nav";
import { AdminAppsClient } from "@/components/admin-apps-client";
import { APP_STATUS, formatPoints, formatDate, safeJsonParse } from "@/lib/constants";

const PAGE_SIZE = 20;

export default async function AdminAppsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login?redirect=/admin/apps");
  if (session.role !== "ADMIN") redirect("/dashboard");

  const params = await searchParams;
  const statusFilter = params.status || "PENDING";
  const currentPage = Math.max(1, parseInt(params.page || "1") || 1);

  const where = statusFilter === "ALL" ? {} : { status: statusFilter };

  const [apps, totalCount] = await Promise.all([
    prisma.app.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { developer: true },
      skip: (currentPage - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.app.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const appData = apps.map((app: typeof apps[number]) => ({
    id: app.id,
    title: app.title,
    description: app.description,
    category: app.category,
    appType: app.appType,
    price: app.price,
    downloadCount: app.downloadCount,
    status: app.status,
    createdAt: app.createdAt.toISOString(),
    // 防御性处理：如果 developer 关联为 null（孤立记录），使用默认值
    developer: {
      name: app.developer?.name ?? "已删除用户",
      email: app.developer?.email ?? "",
    },
    tags: safeJsonParse<string[]>(app.tags, []),
  }));

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-8">
        <AdminNav active="apps" />
        <div>
          <h1 className="text-2xl font-bold mb-1">应用审核</h1>
          <p className="text-sm text-gray-400 mb-6">
            共 {totalCount} 个应用（第 {currentPage}/{totalPages} 页）
          </p>
          <AdminAppsClient
            apps={appData}
            initialStatus={statusFilter}
            pagination={{ currentPage, totalPages, totalCount }}
          />
        </div>
      </div>
    </div>
  );
}

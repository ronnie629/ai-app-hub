import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AdminNav } from "@/components/admin-nav";
import { AdminAppsClient } from "@/components/admin-apps-client";
import { APP_STATUS, formatPoints, formatDate, safeJsonParse } from "@/lib/constants";

export default async function AdminAppsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login?redirect=/admin/apps");
  if (session.role !== "ADMIN") redirect("/dashboard");

  const params = await searchParams;
  const statusFilter = params.status || "PENDING";

  const apps = await prisma.app.findMany({
    where: statusFilter === "ALL" ? {} : { status: statusFilter },
    orderBy: { createdAt: "desc" },
    include: { developer: true },
  });

  const appData = apps.map((app) => ({
    id: app.id,
    title: app.title,
    description: app.description,
    category: app.category,
    appType: app.appType,
    price: app.price,
    downloadCount: app.downloadCount,
    status: app.status,
    createdAt: app.createdAt.toISOString(),
    developer: { name: app.developer.name, email: app.developer.email },
    tags: safeJsonParse<string[]>(app.tags, []),
  }));

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-8">
        <AdminNav active="apps" />
        <div>
          <h1 className="text-2xl font-bold mb-6">应用审核</h1>
          <AdminAppsClient apps={appData} initialStatus={statusFilter} />
        </div>
      </div>
    </div>
  );
}

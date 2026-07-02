import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { AdminNav } from "@/components/admin-nav";
import { AdminLevelConfig } from "@/components/admin-level-config";

export default async function AdminLevelsPage() {
  const session = await getSession();
  if (!session) redirect("/login?redirect=/admin/levels");
  if (session.role !== "ADMIN") redirect("/dashboard");

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-8">
        <AdminNav active="levels" />
        <div>
          <h1 className="text-2xl font-bold mb-6">等级与分润配置</h1>
          <AdminLevelConfig />
        </div>
      </div>
    </div>
  );
}

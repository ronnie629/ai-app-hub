import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { AdminNav } from "@/components/admin-nav";
import { AdminRevenueList } from "@/components/admin-revenue-list";

export default async function AdminRevenuePage() {
  const session = await getSession();
  if (!session) redirect("/login?redirect=/admin/revenue");
  if (session.role !== "ADMIN") redirect("/dashboard");

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-8">
        <AdminNav active="revenue" />
        <div>
          <h1 className="text-2xl font-bold mb-6">平台收入记录</h1>
          <AdminRevenueList />
        </div>
      </div>
    </div>
  );
}

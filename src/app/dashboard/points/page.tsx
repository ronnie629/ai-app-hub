import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { DashboardNav } from "@/components/dashboard-nav";
import { PointsRecharge } from "@/components/points-recharge";

export default async function DashboardPointsPage() {
  const session = await getSession();
  if (!session) redirect("/login?redirect=/dashboard/points");

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-8">
        <DashboardNav active="points" role={session.role} />
        <div>
          <h1 className="text-2xl font-bold mb-6">积分充值</h1>
          <PointsRecharge currentPoints={session.points} />
        </div>
      </div>
    </div>
  );
}

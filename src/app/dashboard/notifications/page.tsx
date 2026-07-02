import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DashboardNav } from "@/components/dashboard-nav";
import { NotificationList } from "@/components/notification-list";

export default async function NotificationsPage() {
  const session = await getSession();
  if (!session) redirect("/login?redirect=/dashboard/notifications");

  const notifications = await prisma.notification.findMany({
    where: { userId: session.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const items = notifications.map((n) => ({
    ...n,
    createdAt: n.createdAt.toISOString(),
  }));

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-8">
        <DashboardNav active="notifications" role={session.role} />
        <div>
          <h1 className="text-2xl font-bold mb-6">消息通知</h1>
          <NotificationList initial={items} />
        </div>
      </div>
    </div>
  );
}

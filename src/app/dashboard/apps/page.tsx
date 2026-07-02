import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MyAppsClient } from "@/components/my-apps-client";

export default async function DashboardAppsPage() {
  const session = await getSession();
  if (!session) redirect("/login?redirect=/dashboard/apps");

  const apps = await prisma.app.findMany({
    where: { developerId: session.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <MyAppsClient
      role={session.role}
      initialApps={apps.map((a) => ({
        id: a.id,
        title: a.title,
        description: a.description,
        status: a.status,
        price: a.price,
        downloadCount: a.downloadCount,
        createdAt: a.createdAt,
        coverImage: a.coverImage,
      }))}
    />
  );
}

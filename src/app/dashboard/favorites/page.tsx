import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DashboardNav } from "@/components/dashboard-nav";
import { FavoriteList } from "@/components/favorite-list";

export default async function FavoritesPage() {
  const session = await getSession();
  if (!session) redirect("/login?redirect=/dashboard/favorites");

  const favorites = await prisma.favorite.findMany({
    where: { userId: session.id },
    orderBy: { createdAt: "desc" },
  });

  const appIds = favorites.map((f) => f.appId);
  const apps = appIds.length
    ? await prisma.app.findMany({
        where: { id: { in: appIds }, status: "APPROVED" },
        include: { developer: { select: { id: true, name: true } } },
      })
    : [];

  const appMap = new Map(apps.map((a) => [a.id, a]));
  const items = favorites
    .filter((f) => appMap.has(f.appId))
    .map((f) => {
      const a = appMap.get(f.appId)!;
      return {
        id: a.id,
        title: a.title,
        description: a.description,
        coverImage: a.coverImage,
        price: a.price,
        category: a.category,
        appType: a.appType,
        downloadCount: a.downloadCount,
        rating: a.rating,
        developerName: a.developer.name,
        favoritedAt: f.createdAt.toISOString(),
        createdAt: a.createdAt.toISOString(),
      };
    });

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-8">
        <DashboardNav active="favorites" role={session.role} />
        <div>
          <h1 className="text-2xl font-bold mb-6">我的收藏</h1>
          <FavoriteList items={items} />
        </div>
      </div>
    </div>
  );
}

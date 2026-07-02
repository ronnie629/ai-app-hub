import { prisma } from "@/lib/prisma";
import { CATEGORIES } from "@/lib/constants";
import { AppCard } from "@/components/app-card";
import { MarketClient } from "@/components/market-client";

interface SearchParams {
  category?: string;
  q?: string;
  sort?: string;
}

export default async function MarketPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const category = params.category || "";
  const query = params.q || "";
  const sort = params.sort || "popular";

  const where = {
    status: "APPROVED" as const,
    ...(category ? { category } : {}),
    ...(query
      ? {
          OR: [
            { title: { contains: query } },
            { description: { contains: query } },
          ],
        }
      : {}),
  };

  const orderBy =
    sort === "newest"
      ? { createdAt: "desc" as const }
      : sort === "price-low"
        ? { price: "asc" as const }
        : sort === "price-high"
          ? { price: "desc" as const }
          : { downloadCount: "desc" as const };

  const apps = await prisma.app.findMany({
    where,
    orderBy,
    include: { developer: true },
  });

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">应用市场</h1>
        <p className="text-gray-500 mt-1">发现 {apps.length} 个优质 AI 应用</p>
      </div>

      <MarketClient
        categories={CATEGORIES}
        apps={apps.map((app) => ({
          ...app,
          createdAt: app.createdAt.toISOString(),
        }))}
        initialCategory={category}
        initialQuery={query}
        initialSort={sort}
      />
    </div>
  );
}

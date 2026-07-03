import { prisma } from "@/lib/prisma";
import { CATEGORIES } from "@/lib/constants";
import { AppCard } from "@/components/app-card";
import { MarketClient } from "@/components/market-client";

interface SearchParams {
  category?: string;
  q?: string;
  sort?: string;
  page?: string;
}

const PAGE_SIZE = 12;

export default async function MarketPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const category = params.category || "";
  const query = params.q || "";
  const sort = params.sort || "popular";
  const currentPage = parseInt(params.page || "1") || 1;

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

  // 并行查询：应用列表 + 总数
  const [apps, totalCount] = await Promise.all([
    prisma.app.findMany({
      where,
      orderBy,
      include: { developer: true },
      skip: (currentPage - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.app.count({ where }),
  ]);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">应用市场</h1>
        <p className="text-gray-500 mt-1">
          发现 {totalCount} 个优质 AI 应用（第 {currentPage}/{totalPages} 页）
        </p>
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
        pagination={{
          currentPage,
          totalPages,
          totalCount,
        }}
      />
    </div>
  );
}

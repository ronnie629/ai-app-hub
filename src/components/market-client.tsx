"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AppCard } from "@/components/app-card";

interface AppData {
  id: string;
  title: string;
  description: string;
  category: string;
  appType: string;
  coverImage: string | null;
  price: number;
  downloadCount: number;
  rating: number;
  createdAt: Date | string;
  developer: { name: string };
}

interface PaginationData {
  currentPage: number;
  totalPages: number;
  totalCount: number;
}

interface MarketClientProps {
  categories: { key: string; label: string; icon: string }[];
  apps: AppData[];
  initialCategory: string;
  initialQuery: string;
  initialSort: string;
  pagination: PaginationData;
}

export function MarketClient({
  categories,
  apps,
  initialCategory,
  initialQuery,
  initialSort,
  pagination,
}: MarketClientProps) {
  const router = useRouter();
  const [category, setCategory] = useState(initialCategory);
  const [query, setQuery] = useState(initialQuery);
  const [sort, setSort] = useState(initialSort);

  const updateUrl = (newCategory: string, newQuery: string, newSort: string, newPage?: number) => {
    const params = new URLSearchParams();
    if (newCategory) params.set("category", newCategory);
    if (newQuery) params.set("q", newQuery);
    if (newSort && newSort !== "popular") params.set("sort", newSort);
    if (newPage && newPage > 1) params.set("page", newPage.toString());
    router.push(`/market?${params.toString()}`);
  };

  const { currentPage, totalPages } = pagination;

  return (
    <div>
      {/* Search and filters */}
      <div className="mb-6 space-y-4">
        {/* Search bar */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") updateUrl(category, query, sort, 1);
              }}
              placeholder="搜索 AI 应用..."
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 pl-10 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              🔍
            </span>
          </div>
          <button
            onClick={() => updateUrl(category, query, sort, 1)}
            className="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
          >
            搜索
          </button>
        </div>

        {/* Category filters */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => {
              setCategory("");
              updateUrl("", query, sort, 1);
            }}
            className={`rounded-full px-4 py-1.5 text-sm font-medium ${
              !category
                ? "bg-indigo-600 text-white"
                : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            全部
          </button>
          {categories.map((cat) => (
            <button
              key={cat.key}
              onClick={() => {
                setCategory(cat.key);
                updateUrl(cat.key, query, sort, 1);
              }}
              className={`rounded-full px-4 py-1.5 text-sm font-medium ${
                category === cat.key
                  ? "bg-indigo-600 text-white"
                  : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {cat.icon} {cat.label}
            </button>
          ))}
        </div>

        {/* Sort */}
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-400">排序：</span>
          {[
            { key: "popular", label: "最热门" },
            { key: "newest", label: "最新上架" },
            { key: "price-low", label: "价格低→高" },
            { key: "price-high", label: "价格高→低" },
          ].map((s) => (
            <button
              key={s.key}
              onClick={() => {
                setSort(s.key);
                updateUrl(category, query, s.key, 1);
              }}
              className={`rounded-lg px-3 py-1 ${
                sort === s.key
                  ? "bg-indigo-50 text-indigo-600 font-medium"
                  : "text-gray-500 hover:bg-gray-100"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* App grid */}
      {apps.length === 0 ? (
        <div className="py-20 text-center">
          <div className="inline-block rounded-full bg-gray-100 p-6 mb-4">
            <span className="text-4xl">🔍</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-700">没有找到匹配的应用</h3>
          <p className="text-gray-400 mt-2">试试换个关键词或分类吧</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {apps.map((app) => (
              <AppCard key={app.id} app={app} compact />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              <button
                onClick={() => updateUrl(category, query, sort, currentPage - 1)}
                disabled={currentPage <= 1}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                上一页
              </button>

              <div className="flex items-center gap-1">
                {[...Array(totalPages)].map((_, i) => {
                  const pageNum = i + 1;
                  // 显示当前页附近的页码
                  if (
                    pageNum === 1 ||
                    pageNum === totalPages ||
                    (pageNum >= currentPage - 2 && pageNum <= currentPage + 2)
                  ) {
                    return (
                      <button
                        key={pageNum}
                        onClick={() => updateUrl(category, query, sort, pageNum)}
                        className={`rounded-lg px-3 py-2 text-sm font-medium ${
                          currentPage === pageNum
                            ? "bg-indigo-600 text-white"
                            : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  }
                  // 显示省略号
                  if (pageNum === currentPage - 3 || pageNum === currentPage + 3) {
                    return <span key={pageNum} className="px-2 text-gray-400">...</span>;
                  }
                  return null;
                })}
              </div>

              <button
                onClick={() => updateUrl(category, query, sort, currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                下一页
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

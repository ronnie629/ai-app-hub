"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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

interface MarketClientProps {
  categories: { key: string; label: string; icon: string }[];
  apps: AppData[];
  initialCategory: string;
  initialQuery: string;
  initialSort: string;
}

export function MarketClient({
  categories,
  apps,
  initialCategory,
  initialQuery,
  initialSort,
}: MarketClientProps) {
  const router = useRouter();
  const [category, setCategory] = useState(initialCategory);
  const [query, setQuery] = useState(initialQuery);
  const [sort, setSort] = useState(initialSort);

  const updateUrl = (newCategory: string, newQuery: string, newSort: string) => {
    const params = new URLSearchParams();
    if (newCategory) params.set("category", newCategory);
    if (newQuery) params.set("q", newQuery);
    if (newSort && newSort !== "popular") params.set("sort", newSort);
    router.push(`/market?${params.toString()}`);
  };

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
                if (e.key === "Enter") updateUrl(category, query, sort);
              }}
              placeholder="搜索 AI 应用..."
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 pl-10 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              🔍
            </span>
          </div>
          <button
            onClick={() => updateUrl(category, query, sort)}
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
              updateUrl("", query, sort);
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
                updateUrl(cat.key, query, sort);
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
                updateUrl(category, query, s.key);
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {apps.map((app) => (
            <AppCard key={app.id} app={app} compact />
          ))}
        </div>
      )}
    </div>
  );
}

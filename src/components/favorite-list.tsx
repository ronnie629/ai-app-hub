"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface FavoriteItem {
  id: string;
  title: string;
  description: string;
  coverImage: string | null;
  price: number;
  category: string;
  appType: string;
  downloadCount: number;
  rating: number;
  developerName: string;
  favoritedAt: string;
  createdAt: string;
}

export function FavoriteList({ items }: { items: FavoriteItem[] }) {
  const router = useRouter();
  const [removing, setRemoving] = useState<string | null>(null);

  const handleRemove = async (appId: string) => {
    if (!confirm("确定要取消收藏吗？")) return;
    setRemoving(appId);
    try {
      await fetch("/api/favorites", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appId }),
      });
      router.refresh();
    } finally {
      setRemoving(null);
    }
  };

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center">
        <div className="text-5xl mb-3">💔</div>
        <h3 className="text-lg font-semibold mb-2">还没有收藏的应用</h3>
        <p className="text-gray-500 text-sm mb-5">去应用市场逛逛，收藏喜欢的应用</p>
        <Link
          href="/market"
          className="inline-flex items-center rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          去应用市场
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((item) => (
        <div
          key={item.id}
          className="rounded-2xl border border-gray-200 bg-white overflow-hidden hover:shadow-md transition-shadow"
        >
          <Link href={`/app/${item.id}`} className="block">
            <div className="aspect-video bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-4xl">
              {item.coverImage ? (
                <img
                  src={item.coverImage}
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>🤖</span>
              )}
            </div>
          </Link>
          <div className="p-4">
            <Link href={`/app/${item.id}`}>
              <h3 className="font-semibold hover:text-indigo-600 truncate">{item.title}</h3>
            </Link>
            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{item.description}</p>
            <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
              <span>{item.developerName}</span>
              <span>★ {item.rating.toFixed(1)} · {item.downloadCount} 次使用</span>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
              <span className="text-xs text-gray-400">
                收藏于 {new Date(item.favoritedAt).toLocaleDateString("zh-CN")}
              </span>
              <button
                onClick={() => handleRemove(item.id)}
                disabled={removing === item.id}
                className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50"
              >
                {removing === item.id ? "处理中..." : "取消收藏"}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

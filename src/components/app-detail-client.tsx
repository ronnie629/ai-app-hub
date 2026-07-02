"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { formatPoints, formatDate, timeAgo, CATEGORIES, APP_TYPES } from "@/lib/constants";
import { AppCard } from "@/components/app-card";

interface AppData {
  id: string;
  title: string;
  description: string;
  category: string;
  appType: string;
  coverImage: string | null;
  screenshots: string[];
  price: number;
  usageInstructions: string;
  accessUrl: string;
  tags: string[];
  downloadCount: number;
  rating: number;
  reviewCount: number;
  createdAt: string;
  status: string;
  developer: { id: string; name: string; bio: string | null };
  reviews: { id: string; rating: number; comment: string; createdAt: string }[];
}

interface AppDetailClientProps {
  app: AppData;
  otherApps: any[];
}

export function AppDetailClient({ app, otherApps }: AppDetailClientProps) {
  const [user, setUser] = useState<any>(null);
  const [hasPurchased, setHasPurchased] = useState(false);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [message, setMessage] = useState("");
  const [activeTab, setActiveTab] = useState<"description" | "instructions" | "reviews">("description");

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then(async (data) => {
        if (data.user) {
          setUser(data.user);
          // Check if already purchased
          const res = await fetch(`/api/apps/${app.id}/purchase-check`);
          const purchaseData = await res.json();
          setHasPurchased(purchaseData.purchased);
        }
      })
      .finally(() => setLoading(false));
  }, [app.id]);

  const handlePurchase = async () => {
    if (!user) {
      window.location.href = "/login";
      return;
    }
    setPurchasing(true);
    setMessage("");
    try {
      const res = await fetch(`/api/apps/${app.id}/purchase`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setHasPurchased(true);
        setMessage("购买成功！现在可以使用该应用了。");
        // Update user points
        setUser({ ...user, points: data.remainingPoints });
      } else {
        setMessage(data.error || "购买失败");
      }
    } catch {
      setMessage("网络错误，请重试");
    } finally {
      setPurchasing(false);
    }
  };

  const category = CATEGORIES.find((c) => c.key === app.category);
  const appType = APP_TYPES.find((t) => t.key === app.appType);

  return (
    <div>
      {/* Header */}
      <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-6 mb-8">
        {/* Cover */}
        <div className="aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 flex items-center justify-center">
          {app.coverImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={app.coverImage} alt={app.title} className="h-full w-full object-cover" />
          ) : (
            <span className="text-6xl">{category?.icon || "📦"}</span>
          )}
        </div>

        {/* Info */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-600">
              {appType?.label || app.appType}
            </span>
            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
              {category?.icon} {category?.label || app.category}
            </span>
          </div>
          <h1 className="text-3xl font-bold mb-3">{app.title}</h1>
          <p className="text-gray-500 mb-4">{app.description}</p>

          {/* Stats */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400 mb-4">
            <span>开发者: <span className="text-gray-700 font-medium">{app.developer.name}</span></span>
            <span>⬇ {app.downloadCount} 次使用</span>
            {app.rating > 0 && <span>⭐ {app.rating.toFixed(1)} ({app.reviewCount} 条评价)</span>}
            <span>上架于 {formatDate(app.createdAt)}</span>
          </div>

          {/* Tags */}
          {app.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {app.tags.map((tag) => (
                <span key={tag} className="rounded-lg bg-gray-100 px-2.5 py-1 text-xs text-gray-500">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Price and buy */}
          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-amber-50 px-4 py-2">
              <span className="text-lg font-bold text-amber-700">
                {app.price === 0 ? "免费" : `⚡ ${formatPoints(app.price)} 积分`}
              </span>
            </div>
            {hasPurchased ? (
              app.accessUrl ? (
                <a
                  href={app.accessUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-xl bg-green-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-green-700"
                >
                  立即使用 →
                </a>
              ) : (
                <span className="rounded-xl bg-green-50 px-4 py-2.5 text-sm font-medium text-green-600">
                  已购买
                </span>
              )
            ) : app.price === 0 ? (
              app.accessUrl ? (
                <a
                  href={app.accessUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
                >
                  免费使用 →
                </a>
              ) : (
                <button className="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white">
                  获取应用
                </button>
              )
            ) : (
              <button
                onClick={handlePurchase}
                disabled={purchasing || loading}
                className="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {purchasing ? "购买中..." : `购买 (${formatPoints(app.price)} 积分)`}
              </button>
            )}
            {user && user.points !== undefined && app.price > 0 && !hasPurchased && (
              <span className="text-sm text-gray-400">
                余额: ⚡ {formatPoints(user.points)}
              </span>
            )}
          </div>
          {message && (
            <div className={`mt-3 rounded-lg px-4 py-2 text-sm ${
              message.includes("成功") ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
            }`}>
              {message}
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-6">
          {[
            { key: "description", label: "应用介绍" },
            { key: "instructions", label: "使用说明" },
            { key: "reviews", label: `用户评价 (${app.reviewCount})` },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`pb-3 text-sm font-medium border-b-2 ${
                activeTab === tab.key
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      {activeTab === "description" && (
        <div className="prose max-w-none">
          <p className="text-gray-600 whitespace-pre-wrap leading-relaxed">{app.description}</p>
          {app.screenshots.length > 0 && (
            <div className="mt-6 grid grid-cols-2 gap-4">
              {app.screenshots.map((url, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={i}
                  src={url}
                  alt={`${app.title} 截图 ${i + 1}`}
                  className="rounded-xl border border-gray-200"
                />
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "instructions" && (
        <div className="prose max-w-none">
          {app.usageInstructions ? (
            <p className="text-gray-600 whitespace-pre-wrap leading-relaxed">{app.usageInstructions}</p>
          ) : (
            <p className="text-gray-400">暂无使用说明</p>
          )}
          {hasPurchased && app.accessUrl && (
            <div className="mt-6 rounded-xl bg-indigo-50 p-4">
              <p className="text-sm text-indigo-600 font-medium mb-2">访问地址</p>
              <a
                href={app.accessUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 underline break-all"
              >
                {app.accessUrl}
              </a>
            </div>
          )}
        </div>
      )}

      {activeTab === "reviews" && (
        <div>
          {app.reviews.length === 0 ? (
            <p className="text-gray-400 text-center py-8">还没有用户评价</p>
          ) : (
            <div className="space-y-4">
              {app.reviews.map((review) => (
                <div key={review.id} className="rounded-xl border border-gray-200 bg-white p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span key={star} className={star <= review.rating ? "text-amber-400" : "text-gray-200"}>
                          ⭐
                        </span>
                      ))}
                    </div>
                    <span className="text-xs text-gray-400">{timeAgo(review.createdAt)}</span>
                  </div>
                  {review.comment && <p className="text-gray-600 text-sm">{review.comment}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Developer other apps */}
      {otherApps.length > 0 && (
        <div className="mt-12">
          <h2 className="text-lg font-bold mb-4">该开发者的其他应用</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {otherApps.map((a) => (
              <AppCard key={a.id} app={a} compact />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

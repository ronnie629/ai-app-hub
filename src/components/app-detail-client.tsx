"use client";

import { useState, useEffect, useRef, useMemo } from "react";
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
  pricePerUse: number;
  usageInstructions: string;
  accessUrl: string;
  tags: string[];
  downloadCount: number;
  rating: number;
  reviewCount: number;
  createdAt: string;
  status: string;
  developer: { id: string; name: string; bio: string | null };
  reviews: {
    id: string;
    rating: number;
    comment: string;
    tags: string[];
    reply: string | null;
    repliedAt: string | null;
    createdAt: string;
  }[];
}

interface SimilarApp {
  id: string;
  title: string;
  description: string;
  category: string;
  appType: string;
  coverImage: string | null;
  price: number;
  rating: number;
  reviewCount: number;
  downloadCount: number;
  tags: string[];
  createdAt: string | Date;
  developer: { id: string; name: string };
}

interface ReviewStats {
  distribution: Record<string, number>;
  total: number;
  average: number;
  tagCloud: Record<string, number>;
}

interface PurchaseStatus {
  purchased: boolean;
  purchaseType: "BUYOUT" | "PER_USE" | null;
  remainingUses: number;
  canUse: boolean;
}

interface AppDetailClientProps {
  app: AppData;
  otherApps: any[];
  hasPurchased?: boolean;
  purchaseStatus?: PurchaseStatus;
}

// 评价标签候选池
const REVIEW_TAG_OPTIONS = [
  "好用", "反应快", "界面美", "功能强", "稳定", "上手快",
  "价格合理", "客服好", "更新频繁", "物超所值",
];

export function AppDetailClient({
  app,
  otherApps,
  hasPurchased: initialHasPurchased = false,
  purchaseStatus: initialPurchaseStatus,
}: AppDetailClientProps) {
  const [user, setUser] = useState<any>(null);
  const [purchaseStatus, setPurchaseStatus] = useState<PurchaseStatus>(
    initialPurchaseStatus || {
      purchased: initialHasPurchased,
      purchaseType: null,
      remainingUses: 0,
      canUse: initialHasPurchased,
    }
  );
  const [favorited, setFavorited] = useState(false);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<"buyout" | "per_use" | null>(null);
  const [favLoading, setFavLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [activeTab, setActiveTab] = useState<"description" | "instructions" | "reviews" | "changelog">(
    "description"
  );
  const [activeScreenshot, setActiveScreenshot] = useState(0);
  const [reviewStats, setReviewStats] = useState<ReviewStats | null>(null);
  const [similarApps, setSimilarApps] = useState<SimilarApp[]>([]);
  const [showReviewModal, setShowReviewModal] = useState(false);

  // 评价表单
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    comment: "",
    tags: [] as string[],
  });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [accessing, setAccessing] = useState(false);

  // 开发者回复
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [submittingReply, setSubmittingReply] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then(async (data) => {
        if (data.user) {
          setUser(data.user);
          const res = await fetch(`/api/apps/${app.id}/purchase-check`);
          const purchaseData = await res.json();
          setPurchaseStatus({
            purchased: purchaseData.purchased,
            purchaseType: purchaseData.purchaseType,
            remainingUses: purchaseData.remainingUses || 0,
            canUse: purchaseData.canUse,
          });
          const favRes = await fetch(`/api/favorites?appId=${app.id}`).catch(() => null);
          if (favRes) {
            const favData = await favRes.json();
            setFavorited(favData.favorited === true);
          }
        }
      })
      .finally(() => setLoading(false));

    // 评分统计
    fetch(`/api/apps/${app.id}/reviews/stats`)
      .then((r) => r.json())
      .then(setReviewStats)
      .catch(() => {});

    // 类似应用
    fetch(`/api/apps/${app.id}/similar`)
      .then((r) => r.json())
      .then((data) => setSimilarApps(data.apps || []))
      .catch(() => {});
  }, [app.id]);

  const handleToggleFavorite = async () => {
    if (!user) {
      window.location.href = `/login?redirect=/app/${app.id}`;
      return;
    }
    setFavLoading(true);
    try {
      if (favorited) {
        await fetch("/api/favorites", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ appId: app.id }),
        });
        setFavorited(false);
      } else {
        await fetch("/api/favorites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ appId: app.id }),
        });
        setFavorited(true);
      }
    } finally {
      setFavLoading(false);
    }
  };

  const handlePurchase = async (type: "buyout" | "per_use") => {
    if (!user) {
      window.location.href = "/login";
      return;
    }
    setPurchasing(type);
    setMessage("");
    try {
      const res = await fetch(`/api/apps/${app.id}/purchase`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      const data = await res.json();
      if (res.ok) {
        const newStatus: PurchaseStatus = {
          purchased: true,
          purchaseType: data.purchaseType || "BUYOUT",
          remainingUses: data.remainingUses ?? -1,
          canUse: true,
        };
        setPurchaseStatus(newStatus);
        setMessage(
          type === "per_use"
            ? "购买成功！已获得 1 次使用次数。"
            : "购买成功！现在可以永久使用该应用了。"
        );
        setUser({ ...user, points: data.remainingPoints });
        setTimeout(() => {
          if (window.confirm("购买成功！是否立即评价？")) {
            setShowReviewModal(true);
          }
        }, 500);
      } else {
        setMessage(data.error || "购买失败");
      }
    } catch {
      setMessage("网络错误，请重试");
    } finally {
      setPurchasing(null);
    }
  };

  const handleUseApp = async () => {
    if (!user) {
      window.location.href = `/login?redirect=/app/${app.id}`;
      return;
    }
    if (!app.accessUrl) {
      setMessage("该应用未配置访问地址");
      return;
    }
    setAccessing(true);
    setMessage("");
    // 先同步打开空白窗口，避免异步 fetch 后被浏览器拦截弹窗
    const newWindow = window.open("about:blank", "_blank");
    if (!newWindow) {
      setMessage("弹窗被拦截，请允许本站弹窗后再试");
      setAccessing(false);
      return;
    }
    try {
      const res = await fetch(`/api/apps/${app.id}/access`, { method: "POST" });
      const data = await res.json();
      if (res.ok && data.useUrl) {
        newWindow.location.href = data.useUrl;
      } else {
        newWindow.close();
        setMessage(data.error || "获取访问权限失败");
      }
    } catch {
      newWindow.close();
      setMessage("网络错误，请重试");
    } finally {
      setAccessing(false);
    }
  };

  const handleSubmitReview = async () => {
    setReviewError("");
    if (reviewForm.comment.length > 500) {
      setReviewError("评论不能超过 500 字");
      return;
    }
    setSubmittingReview(true);
    try {
      const res = await fetch(`/api/apps/${app.id}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reviewForm),
      });
      const data = await res.json();
      if (res.ok) {
        setShowReviewModal(false);
        setReviewForm({ rating: 5, comment: "", tags: [] });
        // 刷新页面以加载新评价
        window.location.reload();
      } else {
        setReviewError(data.error || "评价失败");
      }
    } catch {
      setReviewError("网络错误");
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleSubmitReply = async (reviewId: string) => {
    if (!replyText.trim()) return;
    setSubmittingReply(true);
    try {
      const res = await fetch(`/api/apps/${app.id}/reviews/${reviewId}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reply: replyText }),
      });
      if (res.ok) {
        setReplyingId(null);
        setReplyText("");
        window.location.reload();
      } else {
        const data = await res.json();
        alert(data.error || "回复失败");
      }
    } catch {
      alert("网络错误");
    } finally {
      setSubmittingReply(false);
    }
  };

  const category = CATEGORIES.find((c) => c.key === app.category);
  const appType = APP_TYPES.find((t) => t.key === app.appType);
  const isDeveloper = user?.id === app.developer.id;

  // 评价相关统计
  const totalReviews = reviewStats?.total || app.reviewCount;
  const avgRating = reviewStats?.average || app.rating;
  const ratingDistribution = useMemo(() => {
    if (!reviewStats || totalReviews === 0) return [];
    return [5, 4, 3, 2, 1].map((star) => ({
      star,
      count: reviewStats.distribution[String(star)] || 0,
      percent: ((reviewStats.distribution[String(star)] || 0) / totalReviews) * 100,
    }));
  }, [reviewStats, totalReviews]);

  const topTags = useMemo(() => {
    if (!reviewStats?.tagCloud) return [];
    return Object.entries(reviewStats.tagCloud)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);
  }, [reviewStats]);

  // 所有展示图（封面 + 截图）
  const allImages = useMemo(() => {
    const list: string[] = [];
    if (app.coverImage) list.push(app.coverImage);
    if (app.screenshots && app.screenshots.length > 0) {
      list.push(...app.screenshots);
    }
    return list;
  }, [app.coverImage, app.screenshots]);

  return (
    <div>
      {/* 全宽主视觉 */}
      <div className="mb-8 -mx-4 sm:-mx-6 lg:-mx-8 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            {/* 左侧：截图轮播 */}
            <div>
              {/* 大图 */}
              <div className="aspect-video overflow-hidden rounded-2xl bg-white shadow-lg">
                {allImages.length > 0 ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={allImages[activeScreenshot]}
                    alt={`${app.title} 预览 ${activeScreenshot + 1}`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-8xl">
                    {category?.icon || "📦"}
                  </div>
                )}
              </div>
              {/* 缩略图 */}
              {allImages.length > 1 && (
                <div className="mt-3 flex gap-2 overflow-x-auto pb-2">
                  {allImages.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveScreenshot(idx)}
                      className={`flex-shrink-0 h-16 w-24 overflow-hidden rounded-lg border-2 transition-colors ${
                        activeScreenshot === idx ? "border-indigo-500" : "border-transparent opacity-60 hover:opacity-100"
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img} alt="" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 右侧：标题/描述/标签/统计 */}
            <div>
              <div className="flex flex-wrap items-center gap-1.5 mb-3">
                <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-medium text-indigo-700">
                  {appType?.label || app.appType}
                </span>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-gray-700">
                  {category?.icon} {category?.label || app.category}
                </span>
                {app.rating > 0 && (
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
                    ⭐ {app.rating.toFixed(1)}
                  </span>
                )}
              </div>

              <h1 className="text-3xl font-bold sm:text-4xl">{app.title}</h1>
              <p className="mt-3 text-base text-gray-600">{app.description}</p>

              {app.tags.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {app.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-lg bg-white px-2.5 py-1 text-xs text-gray-600 shadow-sm"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-gray-500">
                <span>开发者：<span className="font-medium text-gray-700">{app.developer.name}</span></span>
                <span>· ⬇ {app.downloadCount} 次使用</span>
                {app.reviewCount > 0 && <span>· 💬 {app.reviewCount} 条评价</span>}
                <span>· 上架于 {formatDate(app.createdAt)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 主体：左内容 + 右浮动卡 */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
        {/* 左侧：内容区 */}
        <div>
          {/* Tabs */}
          <div className="sticky top-0 z-10 -mx-4 bg-white/90 px-4 backdrop-blur sm:mx-0 sm:px-0">
            <div className="border-b border-gray-200">
              <nav className="flex gap-6 overflow-x-auto">
                {[
                  { key: "description", label: "应用介绍" },
                  { key: "instructions", label: "使用说明" },
                  { key: "reviews", label: `用户评价 (${app.reviewCount})` },
                  { key: "changelog", label: "更新日志" },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key as any)}
                    className={`whitespace-nowrap pb-3 pt-3 text-sm font-medium border-b-2 ${
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
          </div>

          {/* Tab content */}
          <div className="mt-6">
            {activeTab === "description" && (
              <div>
                <h2 className="text-lg font-bold mb-3">关于这个应用</h2>
                <p className="text-gray-600 whitespace-pre-wrap leading-relaxed">{app.description}</p>

                {app.screenshots.length > 1 && (
                  <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {app.screenshots.map((url, i) => (
                      /* eslint-disable-next-line @next/next/no-img-element */
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
              <div>
                <h2 className="text-lg font-bold mb-3">使用说明</h2>
                {app.usageInstructions ? (
                  <p className="text-gray-600 whitespace-pre-wrap leading-relaxed">{app.usageInstructions}</p>
                ) : (
                  <p className="text-gray-400">暂无使用说明</p>
                )}
                {purchaseStatus.purchased && app.accessUrl && (
                  <div className="mt-6 rounded-xl bg-indigo-50 p-4">
                    <p className="text-sm font-medium text-indigo-700 mb-2">访问方式</p>
                    <p className="text-sm text-indigo-600">点击右侧「立即使用」按钮即可安全访问应用，每次使用需重新点击。</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === "reviews" && (
              <div>
                {/* 评分汇总 */}
                <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-6 mb-8">
                  {/* 左侧：均分 */}
                  <div className="rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 p-6 text-center">
                    <div className="text-5xl font-bold text-amber-700">
                      {avgRating > 0 ? avgRating.toFixed(1) : "—"}
                    </div>
                    <div className="mt-2 flex items-center justify-center gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <span
                          key={s}
                          className={`text-lg ${
                            avgRating >= s ? "text-amber-400" : "text-amber-200"
                          }`}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                    <div className="mt-2 text-sm text-gray-600">
                      基于 <span className="font-semibold">{totalReviews}</span> 条评价
                    </div>
                  </div>

                  {/* 右侧：分布 + 标签云 */}
                  <div>
                    {totalReviews > 0 ? (
                      <>
                        <div className="space-y-1.5">
                          {ratingDistribution.map((r) => (
                            <div key={r.star} className="flex items-center gap-2 text-sm">
                              <span className="w-8 text-gray-600">{r.star}星</span>
                              <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                                <div
                                  className="h-full bg-amber-400 transition-all"
                                  style={{ width: `${r.percent}%` }}
                                />
                              </div>
                              <span className="w-8 text-right text-gray-500">{r.count}</span>
                            </div>
                          ))}
                        </div>
                        {topTags.length > 0 && (
                          <div className="mt-5">
                            <div className="text-xs text-gray-500 mb-2">用户标签</div>
                            <div className="flex flex-wrap gap-1.5">
                              {topTags.map(([tag, count]) => (
                                <span
                                  key={tag}
                                  className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs text-indigo-700"
                                >
                                  {tag} <span className="text-indigo-400">×{count}</span>
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="rounded-xl bg-gray-50 p-6 text-center text-sm text-gray-500">
                        还没有用户评价，做第一个评价的人吧
                      </div>
                    )}
                  </div>
                </div>

                {/* 评价列表 */}
                {app.reviews.length === 0 ? (
                  <div className="rounded-xl border-2 border-dashed border-gray-200 p-8 text-center">
                    <div className="text-3xl">💬</div>
                    <p className="mt-2 text-sm text-gray-500">还没有用户评价</p>
                    {purchaseStatus.purchased && (
                      <button
                        onClick={() => setShowReviewModal(true)}
                        className="mt-3 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                      >
                        写第一条评价
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {app.reviews.map((review) => (
                      <div
                        key={review.id}
                        className="rounded-xl border border-gray-200 bg-white p-4"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <span
                                  key={star}
                                  className={`text-sm ${
                                    star <= review.rating ? "text-amber-400" : "text-gray-200"
                                  }`}
                                >
                                  ★
                                </span>
                              ))}
                            </div>
                            <div className="mt-1 text-xs text-gray-400">
                              {timeAgo(review.createdAt)}
                            </div>
                          </div>
                          {isDeveloper && !review.reply && (
                            <button
                              onClick={() => {
                                setReplyingId(review.id);
                                setReplyText("");
                              }}
                              className="text-xs text-indigo-600 hover:underline"
                            >
                              回复
                            </button>
                          )}
                        </div>

                        {review.comment && (
                          <p className="mt-2 text-sm text-gray-700">{review.comment}</p>
                        )}

                        {review.tags.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {review.tags.map((t, i) => (
                              <span
                                key={i}
                                className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-500"
                              >
                                {t}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* 开发者回复 */}
                        {review.reply && (
                          <div className="mt-3 ml-4 rounded-lg border-l-2 border-indigo-300 bg-indigo-50/50 p-3">
                            <div className="flex items-center gap-1.5 text-xs text-indigo-700">
                              <span>👨‍💻</span>
                              <span className="font-medium">{app.developer.name} 回复：</span>
                              {review.repliedAt && (
                                <span className="text-indigo-400">
                                  {timeAgo(review.repliedAt)}
                                </span>
                              )}
                            </div>
                            <p className="mt-1 text-sm text-gray-700">{review.reply}</p>
                          </div>
                        )}

                        {/* 回复输入框 */}
                        {replyingId === review.id && (
                          <div className="mt-3 space-y-2">
                            <textarea
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              maxLength={500}
                              rows={3}
                              placeholder="回复用户评价..."
                              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                            />
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => {
                                  setReplyingId(null);
                                  setReplyText("");
                                }}
                                className="rounded-lg px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100"
                              >
                                取消
                              </button>
                              <button
                                onClick={() => handleSubmitReply(review.id)}
                                disabled={submittingReply || !replyText.trim()}
                                className="rounded-lg bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                              >
                                {submittingReply ? "发送中..." : "发送回复"}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "changelog" && (
              <div>
                <h2 className="text-lg font-bold mb-3">更新日志</h2>
                <div className="space-y-3">
                  <div className="rounded-lg border border-gray-200 bg-white p-4">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold text-gray-900">
                        v1.0.0 <span className="ml-2 text-xs text-gray-400">（{formatDate(app.createdAt)}）</span>
                      </div>
                    </div>
                    <p className="mt-1 text-sm text-gray-600">🎉 首次发布到 AIHub 平台</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 类似应用推荐 */}
          {similarApps.length > 0 && (
            <div className="mt-12 border-t border-gray-200 pt-8">
              <h2 className="text-lg font-bold mb-4">你可能也喜欢</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {similarApps.map((a) => (
                  <AppCard key={a.id} app={a} compact />
                ))}
              </div>
            </div>
          )}

          {/* 开发者其他应用 */}
          {otherApps.length > 0 && (
            <div className="mt-8 border-t border-gray-200 pt-8">
              <h2 className="text-lg font-bold mb-4">{app.developer.name} 的其他应用</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {otherApps.map((a) => (
                  <AppCard key={a.id} app={a} compact />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 右侧：浮动购买卡 */}
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            {/* 价格 */}
            <div className="text-center pb-4 border-b border-gray-100">
              {app.price === 0 && app.pricePerUse < 0 ? (
                <div className="text-3xl font-bold text-green-600">免费</div>
              ) : (
                <div className="space-y-2">
                  {app.price > 0 && (
                    <div>
                      <div className="text-3xl font-bold text-amber-700">
                        <span className="text-amber-500">⚡</span> {formatPoints(app.price)}
                      </div>
                      <div className="text-xs text-gray-400">买断价</div>
                    </div>
                  )}
                  {app.pricePerUse >= 0 && (
                    <div>
                      <div className="text-xl font-bold text-indigo-700">
                        <span className="text-indigo-500">⚡</span> {formatPoints(app.pricePerUse)}
                      </div>
                      <div className="text-xs text-gray-400">按次价</div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 购买/使用按钮 */}
            <div className="mt-4 space-y-2">
              {purchaseStatus.purchased && purchaseStatus.canUse ? (
                app.accessUrl ? (
                  <>
                    {purchaseStatus.purchaseType === "BUYOUT" ? (
                      <div className="rounded-xl bg-green-50 px-4 py-2 text-center text-sm font-medium text-green-700">
                        ✓ 已购买
                      </div>
                    ) : purchaseStatus.purchaseType === "PER_USE" ? (
                      <div className="rounded-xl bg-indigo-50 px-4 py-2 text-center text-sm font-medium text-indigo-700">
                        剩余 {purchaseStatus.remainingUses} 次
                      </div>
                    ) : null}
                    <button
                      onClick={handleUseApp}
                      disabled={accessing}
                      className="block w-full rounded-xl bg-green-600 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                    >
                      {accessing ? "正在生成访问链接..." : "立即使用 →"}
                    </button>
                  </>
                ) : (
                  <div className="rounded-xl bg-green-50 px-4 py-3 text-center text-sm font-medium text-green-700">
                    ✓ 已购买
                  </div>
                )
              ) : app.price === 0 && app.pricePerUse < 0 ? (
                app.accessUrl ? (
                  <button
                    onClick={handleUseApp}
                    disabled={accessing}
                    className="block w-full rounded-xl bg-indigo-600 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {accessing ? "正在生成访问链接..." : "免费使用 →"}
                  </button>
                ) : (
                  <button className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white">
                    获取应用
                  </button>
                )
              ) : (
                <>
                  {app.pricePerUse >= 0 && (
                    <button
                      onClick={() => handlePurchase("per_use")}
                      disabled={purchasing === "per_use" || loading}
                      className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                    >
                      {purchasing === "per_use"
                        ? "购买中..."
                        : `按次使用 (${formatPoints(app.pricePerUse)} 积分)`}
                    </button>
                  )}
                  {app.price > 0 && (
                    <button
                      onClick={() => handlePurchase("buyout")}
                      disabled={purchasing === "buyout" || loading}
                      className="w-full rounded-xl bg-amber-500 px-4 py-3 text-sm font-semibold text-white hover:bg-amber-600 disabled:opacity-50"
                    >
                      {purchasing === "buyout" ? "购买中..." : `买断 (${formatPoints(app.price)} 积分)`}
                    </button>
                  )}
                </>
              )}

              <button
                onClick={handleToggleFavorite}
                disabled={favLoading}
                className={`w-full rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors ${
                  favorited
                    ? "border-pink-300 bg-pink-50 text-pink-600"
                    : "border-gray-300 bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                {favorited ? "♥ 已收藏" : "♡ 收藏"}
              </button>

              {purchaseStatus.purchased && (
                <button
                  onClick={() => setShowReviewModal(true)}
                  className="w-full rounded-xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-sm font-medium text-amber-700 hover:bg-amber-100"
                >
                  ⭐ 写评价
                </button>
              )}
            </div>

            {message && (
              <div
                className={`mt-3 rounded-lg px-3 py-2 text-xs ${
                  message.includes("成功")
                    ? "bg-green-50 text-green-600"
                    : "bg-red-50 text-red-600"
                }`}
              >
                {message}
              </div>
            )}

            {user && user.points !== undefined && !purchaseStatus.purchased && (
              <div className="mt-3 text-center text-xs text-gray-500">
                余额：⚡ {formatPoints(user.points)} 积分
              </div>
            )}

            {/* 关键信息 */}
            <div className="mt-4 space-y-2 border-t border-gray-100 pt-4 text-xs text-gray-500">
              <div className="flex justify-between">
                <span>使用量</span>
                <span className="text-gray-700">{app.downloadCount} 次</span>
              </div>
              <div className="flex justify-between">
                <span>评分</span>
                <span className="text-gray-700">
                  {avgRating > 0 ? `⭐ ${avgRating.toFixed(1)}` : "暂无"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>分类</span>
                <span className="text-gray-700">{category?.label}</span>
              </div>
              <div className="flex justify-between">
                <span>类型</span>
                <span className="text-gray-700">{appType?.label}</span>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* 评价弹窗 */}
      {showReviewModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setShowReviewModal(false)}
        >
          <div
            className="w-full max-w-lg rounded-2xl bg-white p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold">写评价</h3>
            <p className="mt-1 text-sm text-gray-500">为 {app.title} 留下你的使用感受</p>

            <div className="mt-4 space-y-4">
              {/* 评分 */}
              <div>
                <label className="text-sm font-medium text-gray-700">评分</label>
                <div className="mt-1.5 flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setReviewForm({ ...reviewForm, rating: s })}
                      className={`text-3xl transition-colors ${
                        s <= reviewForm.rating ? "text-amber-400" : "text-gray-200 hover:text-amber-200"
                      }`}
                    >
                      ★
                    </button>
                  ))}
                  <span className="ml-2 text-sm text-gray-500">{reviewForm.rating} 星</span>
                </div>
              </div>

              {/* 标签 */}
              <div>
                <label className="text-sm font-medium text-gray-700">
                  标签 <span className="text-xs text-gray-400">（最多 5 个）</span>
                </label>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {REVIEW_TAG_OPTIONS.map((tag) => {
                    const selected = reviewForm.tags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => {
                          if (selected) {
                            setReviewForm({
                              ...reviewForm,
                              tags: reviewForm.tags.filter((t) => t !== tag),
                            });
                          } else if (reviewForm.tags.length < 5) {
                            setReviewForm({
                              ...reviewForm,
                              tags: [...reviewForm.tags, tag],
                            });
                          }
                        }}
                        className={`rounded-full px-3 py-1 text-xs transition-colors ${
                          selected
                            ? "bg-indigo-600 text-white"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 评论 */}
              <div>
                <label className="text-sm font-medium text-gray-700">
                  说说你的感受 <span className="text-xs text-gray-400">（选填，≤ 500 字）</span>
                </label>
                <textarea
                  rows={4}
                  maxLength={500}
                  value={reviewForm.comment}
                  onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                  placeholder="你的评价对其他用户和开发者都很有帮助"
                  className="mt-1.5 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                />
                <div className="mt-1 text-right text-xs text-gray-400">
                  {reviewForm.comment.length}/500
                </div>
              </div>

              {reviewError && (
                <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                  {reviewError}
                </div>
              )}
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setShowReviewModal(false)}
                className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleSubmitReview}
                disabled={submittingReview}
                className="rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {submittingReview ? "提交中..." : "提交评价"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

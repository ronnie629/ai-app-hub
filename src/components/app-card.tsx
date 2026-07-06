"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CATEGORIES, APP_TYPES, formatPoints, timeAgo } from "@/lib/constants";

interface AppCardProps {
  app: {
    id: string;
    title: string;
    description: string;
    category: string;
    appType: string;
    coverImage: string | null;
    price: number;
    pricePerUse?: number;
    accessUrl?: string | null;
    downloadCount: number;
    rating: number;
    createdAt: Date | string;
    developer: { name: string };
  };
  compact?: boolean;
}

function isFree(app: AppCardProps["app"]) {
  return app.price === 0 && (app.pricePerUse === undefined || app.pricePerUse < 0);
}

export function AppCard({ app, compact = false }: AppCardProps) {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => setUser(data.user || null))
      .catch(() => setUser(null))
      .finally(() => setChecking(false));
  }, []);

  const category = CATEGORIES.find((c) => c.key === app.category);
  const appType = APP_TYPES.find((t) => t.key === app.appType);

  const handleUse = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const free = isFree(app);
    if (free) {
      // 免费应用：不管是否登录，直接跳转到应用链接
      if (app.accessUrl) {
        window.open(app.accessUrl, "_blank");
      } else {
        router.push(`/app/${app.id}`);
      }
      return;
    }

    // 收费应用：未登录先去注册，注册后返回应用详情；已登录直接去详情购买/使用
    if (!user) {
      router.push(`/register?redirect=/app/${app.id}`);
      return;
    }
    router.push(`/app/${app.id}`);
  };

  const buttonLabel = () => {
    if (isFree(app)) return "立即使用（免费）";
    if (app.pricePerUse !== undefined && app.pricePerUse >= 0) {
      return `立即使用（⚡${formatPoints(app.pricePerUse)}/次）`;
    }
    return `立即使用（⚡${formatPoints(app.price)}）`;
  };

  return (
    <div className="group flex flex-col rounded-2xl border border-gray-200 bg-white overflow-hidden card-hover">
      <Link href={`/app/${app.id}`} className="block flex-1">
        {/* Cover image or gradient */}
        <div className="aspect-video relative overflow-hidden bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100">
          {app.coverImage ? (
            <Image
              src={app.coverImage}
              alt={app.title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              quality={85}
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <span className="text-4xl">{category?.icon || "📦"}</span>
            </div>
          )}
          {/* Price badge */}
          <div className="absolute top-2 right-2">
            {isFree(app) ? (
              <span className="rounded-full bg-green-500 px-2 py-0.5 text-xs font-medium text-white">
                免费
              </span>
            ) : app.price > 0 ? (
              <span className="rounded-full bg-amber-500 px-2 py-0.5 text-xs font-medium text-white">
                ⚡{formatPoints(app.price)}
              </span>
            ) : app.pricePerUse !== undefined && app.pricePerUse >= 0 ? (
              <span className="rounded-full bg-indigo-500 px-2 py-0.5 text-xs font-medium text-white">
                ⚡{formatPoints(app.pricePerUse)}/次
              </span>
            ) : (
              <span className="rounded-full bg-green-500 px-2 py-0.5 text-xs font-medium text-white">
                免费
              </span>
            )}
          </div>
          {/* Type badge */}
          <div className="absolute top-2 left-2">
            <span className="rounded-full bg-black/40 px-2 py-0.5 text-xs font-medium text-white backdrop-blur-sm">
              {appType?.label || app.appType}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="font-semibold text-gray-900 group-hover:text-indigo-600 truncate">
            {app.title}
          </h3>
          {!compact && (
            <p className="mt-1 text-sm text-gray-500 line-clamp-2">{app.description}</p>
          )}
          <div className="mt-3 flex items-center justify-between text-xs text-gray-400">
            <span className="truncate">by {app.developer.name}</span>
            <span>{timeAgo(app.createdAt)}</span>
          </div>
          {!compact && (
            <div className="mt-2 flex items-center gap-3 text-xs text-gray-400">
              <span>⬇ {app.downloadCount}</span>
              {app.rating > 0 && <span>⭐ {app.rating.toFixed(1)}</span>}
            </div>
          )}
        </div>
      </Link>

      {/* Action button */}
      <div className="px-4 pb-4 pt-0">
        <button
          onClick={handleUse}
          disabled={checking}
          className="w-full rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 active:scale-[0.98] transition-transform disabled:opacity-50"
        >
          {buttonLabel()}
        </button>
      </div>
    </div>
  );
}

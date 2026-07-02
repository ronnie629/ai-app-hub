import Link from "next/link";
import { CATEGORIES, APP_TYPES, safeJsonParse, formatPoints, timeAgo } from "@/lib/constants";

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
    downloadCount: number;
    rating: number;
    createdAt: Date | string;
    developer: { name: string };
  };
  compact?: boolean;
}

export function AppCard({ app, compact = false }: AppCardProps) {
  const category = CATEGORIES.find((c) => c.key === app.category);
  const appType = APP_TYPES.find((t) => t.key === app.appType);

  return (
    <Link href={`/app/${app.id}`} className="group block">
      <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden card-hover">
        {/* Cover image or gradient */}
        <div
          className={`${compact ? "h-32" : "h-40"} relative overflow-hidden bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100`}
        >
          {app.coverImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={app.coverImage}
              alt={app.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <span className="text-4xl">{category?.icon || "📦"}</span>
            </div>
          )}
          {/* Price badge */}
          <div className="absolute top-2 right-2">
            {app.price === 0 && (app.pricePerUse === undefined || app.pricePerUse < 0) ? (
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
      </div>
    </Link>
  );
}

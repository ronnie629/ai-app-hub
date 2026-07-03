import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { CATEGORIES } from "@/lib/constants";
import { AppCard } from "@/components/app-card";

export default async function HomePage() {
  // 并行查询：所有数据库查询同时执行
  const [
    featuredApps,
    newestApps,
    totalApps,
    totalUsers,
    totalDownloads,
  ] = await Promise.all([
    // 热门应用（下载量最高）
    prisma.app.findMany({
      where: { status: "APPROVED" },
      orderBy: { downloadCount: "desc" },
      take: 6,
      include: { developer: true },
    }),
    
    // 最新应用
    prisma.app.findMany({
      where: { status: "APPROVED" },
      orderBy: { createdAt: "desc" },
      take: 4,
      include: { developer: true },
    }),
    
    // 统计数据
    prisma.app.count({ where: { status: "APPROVED" } }),
    prisma.user.count(),
    prisma.purchase.count(),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      {/* Hero section */}
      <section className="pt-16 pb-12 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-4 py-1.5 text-sm text-indigo-600 mb-6">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-indigo-500" />
          </span>
          已收录 {totalApps} 个 AI 应用
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
          发现、发布、使用
          <br />
          <span className="gradient-text">优质 AI 应用</span>
        </h1>
        <p className="mt-6 text-lg text-gray-500 max-w-2xl mx-auto">
          连接 AI 开发者与用户。开发者发布应用实现变现，用户开箱即用优质 AI 工具。
        </p>
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/market"
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-base font-semibold text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200"
          >
            探索应用市场
            <span>→</span>
          </Link>
          <Link
            href="/publish"
            className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-6 py-3 text-base font-semibold text-gray-700 hover:bg-gray-50"
          >
            发布我的应用
          </Link>
        </div>

        {/* Stats */}
        <div className="mt-12 grid grid-cols-3 gap-4 max-w-2xl mx-auto">
          <div className="rounded-2xl bg-white border border-gray-200 p-5">
            <div className="text-2xl font-bold text-indigo-600">{totalApps}</div>
            <div className="text-sm text-gray-500 mt-1">上架应用</div>
          </div>
          <div className="rounded-2xl bg-white border border-gray-200 p-5">
            <div className="text-2xl font-bold text-purple-600">{totalUsers}</div>
            <div className="text-sm text-gray-500 mt-1">注册用户</div>
          </div>
          <div className="rounded-2xl bg-white border border-gray-200 p-5">
            <div className="text-2xl font-bold text-pink-600">{totalDownloads}</div>
            <div className="text-sm text-gray-500 mt-1">累计使用</div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-8">
        <h2 className="text-xl font-bold mb-4">浏览分类</h2>
        <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-3">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.key}
              href={`/market?category=${encodeURIComponent(cat.key)}`}
              className="flex flex-col items-center gap-2 rounded-2xl border border-gray-200 bg-white p-4 card-hover"
            >
              <span className="text-2xl">{cat.icon}</span>
              <span className="text-xs font-medium text-gray-600">{cat.label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured apps */}
      {featuredApps.length > 0 && (
        <section className="py-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">热门应用</h2>
            <Link href="/market" className="text-sm text-indigo-600 hover:underline">
              查看全部 →
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {featuredApps.map((app) => (
              <AppCard key={app.id} app={app} />
            ))}
          </div>
        </section>
      )}

      {/* Newest apps */}
      {newestApps.length > 0 && (
        <section className="py-8 pb-16">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">最新上架</h2>
            <Link href="/market?sort=newest" className="text-sm text-indigo-600 hover:underline">
              查看全部 →
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {newestApps.map((app) => (
              <AppCard key={app.id} app={app} compact />
            ))}
          </div>
        </section>
      )}

      {/* Empty state */}
      {featuredApps.length === 0 && (
        <section className="py-16 text-center">
          <div className="inline-block rounded-full bg-gray-100 p-6 mb-4">
            <span className="text-4xl">🚀</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-700">还没有应用上架</h3>
          <p className="text-gray-400 mt-2">成为第一个发布 AI 应用的开发者吧！</p>
          <Link
            href="/publish"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            立即发布应用
          </Link>
        </section>
      )}
    </div>
  );
}

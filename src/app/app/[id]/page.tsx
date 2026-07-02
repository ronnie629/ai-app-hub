import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { CATEGORIES, APP_TYPES, APP_STATUS, safeJsonParse, formatPoints, formatDate, timeAgo } from "@/lib/constants";
import { AppDetailClient } from "@/components/app-detail-client";
import Link from "next/link";

export default async function AppDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const app = await prisma.app.findUnique({
    where: { id },
    include: {
      developer: true,
      reviews: {
        include: { /* user relation not available, skip */ },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!app || app.status === "SUSPENDED") {
    notFound();
  }

  const category = CATEGORIES.find((c) => c.key === app.category);
  const appType = APP_TYPES.find((t) => t.key === app.appType);
  const screenshots = safeJsonParse<string[]>(app.screenshots, []);
  const tags = safeJsonParse<string[]>(app.tags, []);

  // Get developer's other apps
  const otherApps = await prisma.app.findMany({
    where: {
      developerId: app.developerId,
      status: "APPROVED",
      id: { not: app.id },
    },
    take: 3,
    include: { developer: true },
  });

  const appData = {
    id: app.id,
    title: app.title,
    description: app.description,
    category: app.category,
    appType: app.appType,
    coverImage: app.coverImage,
    screenshots,
    price: app.price,
    usageInstructions: app.usageInstructions,
    accessUrl: app.accessUrl,
    tags,
    downloadCount: app.downloadCount,
    rating: app.rating,
    reviewCount: app.reviewCount,
    createdAt: app.createdAt.toISOString(),
    status: app.status,
    developer: {
      id: app.developer.id,
      name: app.developer.name,
      bio: app.developer.bio,
    },
    reviews: app.reviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt.toISOString(),
    })),
  };

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-gray-400">
        <Link href="/market" className="hover:text-indigo-600">应用市场</Link>
        <span>/</span>
        <span>{category?.label || app.category}</span>
        <span>/</span>
        <span className="text-gray-700 truncate">{app.title}</span>
      </nav>

      <AppDetailClient app={appData} otherApps={otherApps.map((a) => ({
        ...a,
        createdAt: a.createdAt.toISOString(),
      }))} />
    </div>
  );
}

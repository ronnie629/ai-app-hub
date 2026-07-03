import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { CATEGORIES, APP_TYPES, safeJsonParse } from "@/lib/constants";
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
        include: { user: { select: { id: true, name: true, avatar: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!app || app.status !== "APPROVED") {
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
    pricePerUse: app.pricePerUse,
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
      tags: safeJsonParse<string[]>(r.tags, []),
      reply: r.reply,
      repliedAt: r.repliedAt?.toISOString() || null,
      createdAt: r.createdAt.toISOString(),
      user: r.user ? { name: r.user.name, avatar: r.user.avatar } : null,
    })),
  };

  // 计算当前用户购买状态（服务端渲染，避免前端闪烁）
  const session = await getSession();
  let purchaseStatus = {
    purchased: false,
    purchaseType: null as "BUYOUT" | "PER_USE" | null,
    remainingUses: 0,
    canUse: false,
  };
  if (session) {
    if (app.developerId === session.id) {
      purchaseStatus = { purchased: true, purchaseType: "BUYOUT", remainingUses: -1, canUse: true };
    } else {
      const buyout = await prisma.purchase.findFirst({
        where: { userId: session.id, appId: app.id, purchaseType: "BUYOUT" },
      });
      if (buyout) {
        purchaseStatus = { purchased: true, purchaseType: "BUYOUT", remainingUses: -1, canUse: true };
      } else {
        const perUseRecords = await prisma.purchase.findMany({
          where: { userId: session.id, appId: app.id, purchaseType: "PER_USE" },
        });
        const remainingUses = perUseRecords.reduce((sum, r) => sum + r.remainingUses, 0);
        if (remainingUses > 0) {
          purchaseStatus = { purchased: true, purchaseType: "PER_USE", remainingUses, canUse: true };
        }
      }
    }
  }

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

      <AppDetailClient app={appData} hasPurchased={purchaseStatus.purchased} purchaseStatus={purchaseStatus} otherApps={otherApps.map((a) => ({
        ...a,
        createdAt: a.createdAt.toISOString(),
      }))} />
    </div>
  );
}

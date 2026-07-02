import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const queryAppId = searchParams.get("appId");

  // 查询单个应用是否已收藏
  if (queryAppId) {
    const existing = await prisma.favorite.findUnique({
      where: { userId_appId: { userId: session.id, appId: queryAppId } },
    });
    return NextResponse.json({ favorited: !!existing });
  }

  const favorites = await prisma.favorite.findMany({
    where: { userId: session.id },
    orderBy: { createdAt: "desc" },
  });

  // 同时返回收藏的应用信息
  const appIds = favorites.map((f) => f.appId);
  const apps = appIds.length
    ? await prisma.app.findMany({
        where: { id: { in: appIds }, status: "APPROVED" },
        include: { developer: { select: { id: true, name: true } } },
      })
    : [];

  const appMap = new Map(apps.map((a) => [a.id, a]));
  const result = favorites
    .map((f) => ({ ...f, app: appMap.get(f.appId) }))
    .filter((f) => f.app); // 过滤掉已下架的应用

  return NextResponse.json({ favorites: result });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const { appId } = await req.json();
  if (!appId) return NextResponse.json({ error: "缺少 appId" }, { status: 400 });

  const app = await prisma.app.findUnique({ where: { id: appId } });
  if (!app) return NextResponse.json({ error: "应用不存在" }, { status: 404 });

  const existing = await prisma.favorite.findUnique({
    where: { userId_appId: { userId: session.id, appId } },
  });
  if (existing) {
    return NextResponse.json({ ok: true, favorited: true });
  }

  await prisma.favorite.create({
    data: { userId: session.id, appId },
  });

  return NextResponse.json({ ok: true, favorited: true });
}

export async function DELETE(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const { appId } = await req.json();
  if (!appId) return NextResponse.json({ error: "缺少 appId" }, { status: 400 });

  await prisma.favorite.deleteMany({
    where: { userId: session.id, appId },
  });

  return NextResponse.json({ ok: true, favorited: false });
}

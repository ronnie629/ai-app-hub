import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

/**
 * GET /api/apps/[id]/similar
 * 返回同分类的推荐应用（最多 8 个，排除自己）
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: appId } = await params;

  try {
    const current = await prisma.app.findUnique({
      where: { id: appId },
      select: { category: true },
    });
    if (!current) {
      return NextResponse.json({ apps: [] });
    }

    const apps = await prisma.app.findMany({
      where: {
        status: "APPROVED",
        category: current.category,
        id: { not: appId },
      },
      orderBy: [{ downloadCount: "desc" }, { rating: "desc" }],
      take: 8,
      include: {
        developer: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ apps });
  } catch (err) {
    console.error("Similar apps error:", err);
    return NextResponse.json({ error: "获取失败" }, { status: 500 });
  }
}

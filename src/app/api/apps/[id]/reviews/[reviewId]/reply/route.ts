import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

/**
 * POST /api/apps/[id]/reviews/[reviewId]/reply
 * Body: { reply: string }
 * 开发者回复评价（仅 app 的开发者本人可回复）
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; reviewId: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const { id: appId, reviewId } = await params;

  try {
    const body = await req.json();
    const replyText = (body.reply || "").toString().trim();

    if (!replyText) {
      return NextResponse.json({ error: "回复内容不能为空" }, { status: 400 });
    }
    if (replyText.length > 500) {
      return NextResponse.json({ error: "回复内容不能超过 500 字" }, { status: 400 });
    }

    // 校验：必须是这个 app 的开发者
    const app = await prisma.app.findUnique({ where: { id: appId } });
    if (!app) {
      return NextResponse.json({ error: "应用不存在" }, { status: 404 });
    }
    if (app.developerId !== session.id) {
      return NextResponse.json({ error: "仅开发者可回复评价" }, { status: 403 });
    }

    // 校验：review 必须属于这个 app
    const review = await prisma.review.findUnique({ where: { id: reviewId } });
    if (!review || review.appId !== appId) {
      return NextResponse.json({ error: "评价不存在" }, { status: 404 });
    }

    await prisma.review.update({
      where: { id: reviewId },
      data: {
        reply: replyText,
        repliedAt: new Date(),
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Reply review error:", err);
    return NextResponse.json({ error: "回复失败" }, { status: 500 });
  }
}

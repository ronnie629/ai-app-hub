import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

/**
 * POST /api/apps/[id]/reviews
 * Body: { rating: 1-5, comment: string, tags: string[] }
 * 提交评价（仅购买过的用户可评价）
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const { id: appId } = await params;

  try {
    const body = await req.json();
    const { rating, comment, tags } = body;

    // 校验
    const ratingNum = parseInt(rating);
    if (!ratingNum || ratingNum < 1 || ratingNum > 5) {
      return NextResponse.json({ error: "评分必须为 1-5 星" }, { status: 400 });
    }
    if (Array.isArray(tags) && tags.length > 5) {
      return NextResponse.json({ error: "标签最多 5 个" }, { status: 400 });
    }

    // 必须购买过才能评价
    const purchase = await prisma.purchase.findFirst({
      where: { userId: session.id, appId },
    });
    if (!purchase) {
      return NextResponse.json({ error: "请先购买后再评价" }, { status: 403 });
    }

    // 限制评价 comment 长度
    const commentStr = (comment || "").toString().slice(0, 500);

    // upsert（一个用户对一个 app 只能有一条评价）
    const review = await prisma.review.upsert({
      where: { userId_appId: { userId: session.id, appId } },
      create: {
        userId: session.id,
        appId,
        rating: ratingNum,
        comment: commentStr,
        tags: JSON.stringify(Array.isArray(tags) ? tags.slice(0, 5) : []),
      },
      update: {
        rating: ratingNum,
        comment: commentStr,
        tags: JSON.stringify(Array.isArray(tags) ? tags.slice(0, 5) : []),
      },
    });

    // 重新计算 app 平均评分
    const stats = await prisma.review.aggregate({
      where: { appId },
      _avg: { rating: true },
      _count: true,
    });

    await prisma.app.update({
      where: { id: appId },
      data: {
        rating: stats._avg.rating || 0,
        reviewCount: stats._count,
      },
    });

    return NextResponse.json({ ok: true, reviewId: review.id });
  } catch (err) {
    console.error("Create review error:", err);
    return NextResponse.json({ error: "评价失败" }, { status: 500 });
  }
}

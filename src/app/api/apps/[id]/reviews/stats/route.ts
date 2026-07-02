import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/apps/[id]/reviews/stats
 * 返回评分分布 + 标签云统计
 * {
 *   distribution: { 5: 8, 4: 2, 3: 0, 2: 0, 1: 1 },
 *   total: 11,
 *   average: 4.5,
 *   tagCloud: { "好用": 5, "反应快": 3, "界面美": 2, ... }
 * }
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: appId } = await params;

  try {
    const reviews = await prisma.review.findMany({
      where: { appId },
      select: { rating: true, tags: true },
    });

    const distribution: Record<string, number> = { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 };
    const tagCloud: Record<string, number> = {};
    let totalRating = 0;

    for (const r of reviews) {
      distribution[String(r.rating)] = (distribution[String(r.rating)] || 0) + 1;
      totalRating += r.rating;
      try {
        const tags = JSON.parse(r.tags) as string[];
        for (const t of tags) {
          tagCloud[t] = (tagCloud[t] || 0) + 1;
        }
      } catch {
        // ignore parse error
      }
    }

    const total = reviews.length;
    const average = total > 0 ? totalRating / total : 0;

    return NextResponse.json({
      distribution,
      total,
      average: Math.round(average * 10) / 10,
      tagCloud,
    });
  } catch (err) {
    console.error("Review stats error:", err);
    return NextResponse.json({ error: "获取失败" }, { status: 500 });
  }
}

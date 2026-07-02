import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const { id: appId } = await params;

    const app = await prisma.app.findUnique({ where: { id: appId } });
    if (!app || app.status !== "APPROVED") {
      return NextResponse.json({ error: "应用不存在或已下架" }, { status: 404 });
    }

    // Check if already purchased
    const existing = await prisma.purchase.findFirst({
      where: { userId: session.id, appId },
    });
    if (existing) {
      return NextResponse.json({ error: "已购买过该应用" }, { status: 400 });
    }

    // Free app
    if (app.price === 0) {
      const purchase = await prisma.purchase.create({
        data: {
          userId: session.id,
          appId,
          pointsCost: 0,
          developerEarning: 0,
          platformEarning: 0,
        },
      });
      await prisma.app.update({
        where: { id: appId },
        data: { downloadCount: { increment: 1 } },
      });
      return NextResponse.json({ ok: true, purchaseId: purchase.id, remainingPoints: session.points });
    }

    // Check points
    const user = await prisma.user.findUnique({ where: { id: session.id } });
    if (!user || user.points < app.price) {
      return NextResponse.json({ error: "积分不足，请先充值" }, { status: 400 });
    }

    // Get platform config
    let platformFeeRate = 0.1;
    const config = await prisma.platformConfig.findUnique({ where: { id: "default" } });
    if (config) {
      platformFeeRate = config.platformFeeRate;
    }

    const platformEarning = Math.floor(app.price * platformFeeRate);
    const developerEarning = app.price - platformEarning;

    // Transaction: deduct points, create purchase, update app count, record transaction
    const result = await prisma.$transaction(async (tx) => {
      // Deduct points from user
      const updatedUser = await tx.user.update({
        where: { id: session.id },
        data: { points: { decrement: app.price } },
      });

      // Add earnings to developer
      if (app.developerId !== session.id) {
        await tx.user.update({
          where: { id: app.developerId },
          data: { points: { increment: developerEarning } },
        });

        // Record developer earning transaction
        await tx.pointsTransaction.create({
          data: {
            userId: app.developerId,
            type: "EARNING",
            amount: developerEarning,
            balanceAfter: 0, // We don't track exact balance here for simplicity
            description: `应用「${app.title}」销售收入`,
            relatedId: appId,
          },
        });
      }

      // Create purchase record
      const purchase = await tx.purchase.create({
        data: {
          userId: session.id,
          appId,
          pointsCost: app.price,
          developerEarning,
          platformEarning,
        },
      });

      // Record user spending transaction
      await tx.pointsTransaction.create({
        data: {
          userId: session.id,
          type: "PURCHASE",
          amount: -app.price,
          balanceAfter: updatedUser.points,
          description: `购买应用「${app.title}」`,
          relatedId: appId,
        },
      });

      // Increment download count
      await tx.app.update({
        where: { id: appId },
        data: { downloadCount: { increment: 1 } },
      });

      return { purchase, remainingPoints: updatedUser.points };
    });

    return NextResponse.json({
      ok: true,
      purchaseId: result.purchase.id,
      remainingPoints: result.remainingPoints,
    });
  } catch (error) {
    console.error("Purchase error:", error);
    return NextResponse.json({ error: "购买失败" }, { status: 500 });
  }
}

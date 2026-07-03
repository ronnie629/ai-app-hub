import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getDeveloperShareRate, refreshLevelSnapshot } from "@/lib/user-level";

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
    const body = await req.json().catch(() => ({}));
    const type = body.type === "per_use" ? "PER_USE" : "BUYOUT";

    const app = await prisma.app.findUnique({ where: { id: appId } });
    if (!app || app.status !== "APPROVED") {
      return NextResponse.json({ error: "应用不存在或已下架" }, { status: 404 });
    }

    // 开发者不能购买自己的应用
    if (app.developerId === session.id) {
      return NextResponse.json({ error: "不能购买自己的应用" }, { status: 400 });
    }

    // 买断：检查是否已有任何完成记录（买断永久有效）
    if (type === "BUYOUT") {
      const existingBuyout = await prisma.purchase.findFirst({
        where: { userId: session.id, appId, purchaseType: "BUYOUT" },
      });
      if (existingBuyout) {
        return NextResponse.json({ error: "已购买过该应用" }, { status: 400 });
      }
    }

    const price = type === "PER_USE" ? app.pricePerUse : app.price;

    // 验证价格
    if (price < 0) {
      return NextResponse.json({ error: "该应用未开放此购买方式" }, { status: 400 });
    }

    // 免费应用（买断或按次价格为0），直接创建记录
    if (price === 0) {
      const purchase = await prisma.purchase.create({
        data: {
          userId: session.id,
          appId,
          pointsCost: 0,
          purchaseType: type,
          remainingUses: type === "PER_USE" ? 1 : 0,
          developerEarning: 0,
          platformEarning: 0,
        },
      });
      await prisma.app.update({
        where: { id: appId },
        data: { downloadCount: { increment: 1 } },
      });
      return NextResponse.json({
        ok: true,
        purchaseId: purchase.id,
        purchaseType: purchase.purchaseType,
        remainingPoints: session.points,
      });
    }

    // 积分检查
    const user = await prisma.user.findUnique({ where: { id: session.id } });
    if (!user || user.points < price) {
      return NextResponse.json({ error: "积分不足，请先充值" }, { status: 400 });
    }

    // 获取开发者等级对应的分润比例（含降级保护）
    await refreshLevelSnapshot(app.developerId);
    const { rate: devShareRate, platformFeeRate } = await getDeveloperShareRate(app.developerId);

    const platformEarning = Math.floor(price * platformFeeRate);
    const developerEarning = price - platformEarning;

    const result = await prisma.$transaction(async (tx) => {
      // 扣除用户积分 + 记录最后购买时间
      const updatedUser = await tx.user.update({
        where: { id: session.id },
        data: { points: { decrement: price }, lastPurchaseAt: new Date() },
      });

      // 增加开发者收入
      if (developerEarning > 0) {
        const updatedDeveloper = await tx.user.update({
          where: { id: app.developerId },
          data: { points: { increment: developerEarning } },
        });

        await tx.pointsTransaction.create({
          data: {
            userId: app.developerId,
            type: "EARNING",
            amount: developerEarning,
            balanceAfter: updatedDeveloper.points,
            description: `应用「${app.title}」${type === "PER_USE" ? "按次使用" : "买断"}收入`,
            relatedId: appId,
          },
        });
      }

      // 创建购买记录
      const purchase = await tx.purchase.create({
        data: {
          userId: session.id,
          appId,
          pointsCost: price,
          purchaseType: type,
          remainingUses: type === "PER_USE" ? 1 : 0,
          developerEarning,
          platformEarning,
          platformFeeRate,
        },
      });

      // 记录用户支出
      await tx.pointsTransaction.create({
        data: {
          userId: session.id,
          type: "PURCHASE",
          amount: -price,
          balanceAfter: updatedUser.points,
          description: `${type === "PER_USE" ? "按次购买" : "买断"}应用「${app.title}」`,
          relatedId: appId,
        },
      });

      // 增加使用量
      await tx.app.update({
        where: { id: appId },
        data: { downloadCount: { increment: 1 } },
      });

      return { purchase, remainingPoints: updatedUser.points };
    });

    return NextResponse.json({
      ok: true,
      purchaseId: result.purchase.id,
      purchaseType: result.purchase.purchaseType,
      remainingUses: result.purchase.remainingUses,
      remainingPoints: result.remainingPoints,
    });
  } catch (error) {
    console.error("Purchase error:", error);
    return NextResponse.json({ error: "购买失败" }, { status: 500 });
  }
}

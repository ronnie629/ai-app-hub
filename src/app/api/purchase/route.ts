import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import crypto from "crypto";

const TOKEN_EXPIRY_MS = 30 * 60 * 1000; // 30 分钟

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const { appId } = await req.json();
    if (!appId) {
      return NextResponse.json({ error: "缺少应用ID" }, { status: 400 });
    }

    // 查询应用信息
    const app = await prisma.app.findUnique({
      where: { id: appId },
      select: {
        id: true,
        title: true,
        status: true,
        price: true,
        pricePerUse: true,
        developerId: true,
        accessUrl: true,
      },
    });

    if (!app || app.status !== "APPROVED") {
      return NextResponse.json({ error: "应用不可用" }, { status: 400 });
    }

    if (app.developerId === session.id) {
      return NextResponse.json({ error: "不能购买自己的应用" }, { status: 400 });
    }

    // 判断购买方式：pricePerUse > 0 时按次计费，否则买断
    const isPerUse = app.pricePerUse > 0;
    const cost = isPerUse ? app.pricePerUse : app.price;

    // 检查积分是否足够
    if (session.points < cost) {
      return NextResponse.json({ error: "积分不足，请先充值" }, { status: 400 });
    }

    // 检查是否已买断
    if (!isPerUse) {
      const existingBuyout = await prisma.purchase.findFirst({
        where: { userId: session.id, appId, purchaseType: "BUYOUT" },
      });
      if (existingBuyout) {
        return NextResponse.json({ error: "您已购买该应用，无需重复购买" }, { status: 400 });
      }
    }

    // 查询平台费率
    const platformConfig = await prisma.platformConfig.findUnique({
      where: { id: "default" },
    });
    const feeRate = platformConfig?.platformFeeRate ?? 0.1;
    const platformEarning = Math.floor(cost * feeRate);
    const developerEarning = cost - platformEarning;

    const purchaseType = isPerUse ? "PER_USE" : "BUYOUT";

    // 使用事务：扣减积分、创建购买记录、创建积分流水、生成 AccessToken
    const result = await prisma.$transaction(async (tx) => {
      // 1. 扣减用户积分（消费者）
      const updatedUser = await tx.user.update({
        where: { id: session.id },
        data: { points: { decrement: cost }, lastPurchaseAt: new Date() },
      });

      if (updatedUser.points < 0) {
        throw new Error("INSUFFICIENT_POINTS");
      }

      // 2. 创建购买记录
      const purchase = await tx.purchase.create({
        data: {
          userId: session.id,
          appId,
          pointsCost: cost,
          purchaseType,
          remainingUses: isPerUse ? 1 : 0,
          developerEarning,
          platformEarning,
          platformFeeRate: feeRate,
          status: "COMPLETED",
        },
      });

      // 3. 增加开发者收益并记录流水
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
            description: `应用「${app.title}」${isPerUse ? "按次使用" : "买断"}收入`,
            relatedId: purchase.id,
            consumerId: session.id,
            purchaseAmount: cost,
          },
        });
      }

      // 4. 记录消费流水（消费者支出）
      await tx.pointsTransaction.create({
        data: {
          userId: session.id,
          type: "PURCHASE",
          amount: -cost,
          balanceAfter: updatedUser.points,
          description: `${isPerUse ? "按次购买" : "买断"}应用「${app.title}」`,
          relatedId: purchase.id,
        },
      });

      // 5. 生成 AccessToken
      const token = crypto.randomBytes(32).toString("hex");
      const accessToken = await tx.accessToken.create({
        data: {
          userId: session.id,
          appId,
          token,
          status: "ACTIVE",
          expiresAt: new Date(Date.now() + TOKEN_EXPIRY_MS),
        },
      });

      // 6. 增加下载计数
      await tx.app.update({
        where: { id: appId },
        data: { downloadCount: { increment: 1 } },
      });

      return {
        purchaseId: purchase.id,
        token: accessToken.token,
        remainingUses: purchase.remainingUses,
        newPoints: updatedUser.points,
      };
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (error: any) {
    if (error?.message === "INSUFFICIENT_POINTS") {
      return NextResponse.json({ error: "积分不足" }, { status: 400 });
    }
    console.error("Purchase error:", error);
    return NextResponse.json({ error: "购买失败，请稍后重试" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { randomBytes } from "crypto";

// POST: 生成一次性访问 Token
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const { id: appId } = await params;

    const app = await prisma.app.findUnique({
      where: { id: appId },
      select: { id: true, accessUrl: true, status: true, price: true, pricePerUse: true, developerId: true, title: true },
    });

    if (!app) {
      return NextResponse.json({ error: "应用不存在" }, { status: 404 });
    }

    if (app.status !== "APPROVED") {
      return NextResponse.json({ error: "应用未上架" }, { status: 403 });
    }

    if (!app.accessUrl) {
      return NextResponse.json({ error: "该应用未配置访问地址" }, { status: 400 });
    }

    const isDeveloper = app.developerId === session.id;

    // 检查使用权限：买断 / 按次剩余 / 免费
    let canUse = false;

    if (!isDeveloper) {
      // 1. 买断
      const buyout = await prisma.purchase.findFirst({
        where: { userId: session.id, appId, purchaseType: "BUYOUT" },
      });
      if (buyout) {
        canUse = true;
      } else {
        // 2. 按次剩余
        const perUseRecords = await prisma.purchase.findMany({
          where: { userId: session.id, appId, purchaseType: "PER_USE", remainingUses: { gt: 0 } },
          orderBy: { createdAt: "asc" },
        });
        if (perUseRecords.length > 0) {
          const target = perUseRecords[0];
          await prisma.purchase.update({
            where: { id: target.id },
            data: { remainingUses: { decrement: 1 } },
          });
          canUse = true;
        } else if (app.price === 0 && app.pricePerUse < 0) {
          // 3. 免费应用：自动创建一条买断记录
          await prisma.purchase.create({
            data: {
              userId: session.id,
              appId,
              pointsCost: 0,
              purchaseType: "BUYOUT",
              remainingUses: 0,
              developerEarning: 0,
              platformEarning: 0,
            },
          });
          canUse = true;
        }
      }
    } else {
      canUse = true; // 开发者自己
    }

    if (!canUse) {
      return NextResponse.json({ error: "请先购买或按次使用该应用" }, { status: 403 });
    }

    // 将旧 token 标记为失效
    await prisma.accessToken.updateMany({
      where: { userId: session.id, appId, status: "ACTIVE" },
      data: { status: "USED", usedAt: new Date() },
    });

    // 生成新 token（30 分钟有效）
    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

    await prisma.accessToken.create({
      data: {
        userId: session.id,
        appId,
        token,
        status: "ACTIVE",
        expiresAt,
      },
    });

    await prisma.app.update({
      where: { id: appId },
      data: { downloadCount: { increment: 1 } },
    });

    return NextResponse.json({
      token,
      expiresAt: expiresAt.toISOString(),
      useUrl: `/use/${appId}?token=${token}`,
    });
  } catch (error) {
    console.error("Generate access token error:", error);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
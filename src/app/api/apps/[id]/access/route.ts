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

    // 查询应用
    const app = await prisma.app.findUnique({
      where: { id: appId },
      select: { id: true, accessUrl: true, status: true, price: true },
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

    // 验证购买记录（免费应用也需要有购买记录）
    const purchase = await prisma.purchase.findFirst({
      where: {
        userId: session.id,
        appId: appId,
        status: "COMPLETED",
      },
    });

    if (!purchase) {
      return NextResponse.json({ error: "请先购买该应用" }, { status: 403 });
    }

    // 将该用户对该应用的所有旧 token 标记为失效
    await prisma.accessToken.updateMany({
      where: {
        userId: session.id,
        appId: appId,
        status: "ACTIVE",
      },
      data: {
        status: "USED",
        usedAt: new Date(),
      },
    });

    // 生成新的一次性 token（30 分钟有效期）
    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 min

    await prisma.accessToken.create({
      data: {
        userId: session.id,
        appId: appId,
        token: token,
        status: "ACTIVE",
        expiresAt: expiresAt,
      },
    });

    // 增加使用次数
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

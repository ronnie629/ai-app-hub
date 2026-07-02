import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({
        purchased: false,
        purchaseType: null,
        remainingUses: 0,
        canUse: false,
      });
    }

    const { id: appId } = await params;
    const app = await prisma.app.findUnique({ where: { id: appId } });

    // 开发者自己访问
    if (app?.developerId === session.id) {
      return NextResponse.json({
        purchased: true,
        purchaseType: "BUYOUT",
        remainingUses: -1, // -1 表示无限
        canUse: true,
      });
    }

    // 免费应用
    if (app?.price === 0 && app?.pricePerUse < 0) {
      return NextResponse.json({
        purchased: true,
        purchaseType: "BUYOUT",
        remainingUses: -1,
        canUse: true,
      });
    }

    // 买断
    const buyout = await prisma.purchase.findFirst({
      where: { userId: session.id, appId, purchaseType: "BUYOUT" },
    });
    if (buyout) {
      return NextResponse.json({
        purchased: true,
        purchaseType: "BUYOUT",
        remainingUses: -1,
        canUse: true,
      });
    }

    // 按次购买
    const perUseRecords = await prisma.purchase.findMany({
      where: { userId: session.id, appId, purchaseType: "PER_USE" },
    });
    const remainingUses = perUseRecords.reduce((sum, r) => sum + r.remainingUses, 0);

    return NextResponse.json({
      purchased: remainingUses > 0,
      purchaseType: remainingUses > 0 ? "PER_USE" : null,
      remainingUses,
      canUse: remainingUses > 0,
    });
  } catch {
    return NextResponse.json({
      purchased: false,
      purchaseType: null,
      remainingUses: 0,
      canUse: false,
    });
  }
}
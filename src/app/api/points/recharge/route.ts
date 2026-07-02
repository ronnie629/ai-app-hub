import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

const RECHARGE_OPTIONS = [
  { points: 100, bonus: 0, price: "¥9.9" },
  { points: 500, bonus: 25, price: "¥45" },
  { points: 1000, bonus: 100, price: "¥88" },
  { points: 5000, bonus: 800, price: "¥399" },
];

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const { optionIndex } = await req.json();
    const option = RECHARGE_OPTIONS[optionIndex];
    if (!option) {
      return NextResponse.json({ error: "无效的充值选项" }, { status: 400 });
    }

    const pointsToAdd = option.points + option.bonus;

    // MVP: Simulate recharge (no real payment)
    const result = await prisma.$transaction(async (tx) => {
      const updatedUser = await tx.user.update({
        where: { id: session.id },
        data: { points: { increment: pointsToAdd } },
      });

      await tx.pointsTransaction.create({
        data: {
          userId: session.id,
          type: "RECHARGE",
          amount: pointsToAdd,
          balanceAfter: updatedUser.points,
          description: `充值${option.price}获得${option.points}积分${option.bonus > 0 ? `（赠送${option.bonus}）` : ""}`,
        },
      });

      return updatedUser;
    });

    return NextResponse.json({
      ok: true,
      pointsAdded: pointsToAdd,
      balance: result.points,
    });
  } catch (error) {
    console.error("Recharge error:", error);
    return NextResponse.json({ error: "充值失败" }, { status: 500 });
  }
}

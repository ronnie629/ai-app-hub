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

    // Real payment not yet integrated — disable for production safety
    return NextResponse.json({ error: "充值功能暂未开放，敬请期待" }, { status: 403 });
  } catch (error) {
    console.error("Recharge error:", error);
    return NextResponse.json({ error: "充值失败" }, { status: 500 });
  }
}

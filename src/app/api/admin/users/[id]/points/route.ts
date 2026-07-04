import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "无权限" }, { status: 403 });
    }

    const { id } = await params;
    const transactions = await prisma.pointsTransaction.findMany({
      where: { userId: id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      transactions: transactions.map((t) => ({
        ...t,
        createdAt: t.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Admin user points error:", error);
    return NextResponse.json({ error: "获取积分记录失败" }, { status: 500 });
  }
}

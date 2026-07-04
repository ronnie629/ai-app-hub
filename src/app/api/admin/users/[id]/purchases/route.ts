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
    const purchases = await prisma.purchase.findMany({
      where: { userId: id },
      orderBy: { createdAt: "desc" },
      include: {
        app: { select: { title: true } },
      },
    });

    return NextResponse.json({
      purchases: purchases.map((p) => ({
        ...p,
        createdAt: p.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Admin user purchases error:", error);
    return NextResponse.json({ error: "获取购买记录失败" }, { status: 500 });
  }
}

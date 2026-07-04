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
    const apps = await prisma.app.findMany({
      where: { developerId: id },
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { purchases: true } },
      },
    });

    return NextResponse.json({
      apps: apps.map((app) => ({
        ...app,
        createdAt: app.createdAt.toISOString(),
        updatedAt: app.updatedAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Admin user apps error:", error);
    return NextResponse.json({ error: "获取应用列表失败" }, { status: 500 });
  }
}

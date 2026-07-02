import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "无权限" }, { status: 403 });
    }

    const { id: appId } = await params;
    const { action } = await req.json();

    const statusMap: Record<string, string> = {
      approve: "APPROVED",
      reject: "REJECTED",
      suspend: "SUSPENDED",
    };

    const newStatus = statusMap[action];
    if (!newStatus) {
      return NextResponse.json({ error: "无效操作" }, { status: 400 });
    }

    const app = await prisma.app.update({
      where: { id: appId },
      data: { status: newStatus },
    });

    return NextResponse.json({ ok: true, status: app.status });
  } catch (error) {
    console.error("Admin app action error:", error);
    return NextResponse.json({ error: "操作失败" }, { status: 500 });
  }
}

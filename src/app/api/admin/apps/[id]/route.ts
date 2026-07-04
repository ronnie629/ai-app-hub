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

    // 通知开发者审核结果
    const statusMessages: Record<string, { title: string; content: string }> = {
      approve: { title: "应用已通过审核", content: `您的应用「${app.title}」已通过审核并上架。` },
      reject: { title: "应用未通过审核", content: `您的应用「${app.title}」未能通过审核，请检查后重新提交。` },
      suspend: { title: "应用已下架", content: `您的应用「${app.title}」已被管理员下架。` },
    };
    const msg = statusMessages[action];
    if (msg) {
      await prisma.notification.create({
        data: {
          userId: app.developerId,
          type: "APP_REVIEW",
          title: msg.title,
          content: msg.content,
          link: `/app/${app.id}`,
        },
      });
    }

    return NextResponse.json({ ok: true, status: app.status });
  } catch (error) {
    console.error("Admin app action error:", error);
    return NextResponse.json({ error: "操作失败" }, { status: 500 });
  }
}

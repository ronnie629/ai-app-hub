import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const count = await prisma.notification.count({
    where: { userId: session.id, read: false },
  });

  return NextResponse.json({ count });
}

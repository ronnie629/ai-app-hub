import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      role: true,
      points: true,
      bio: true,
      avatar: true,
      isDeveloper: true,
      profession: true,
      interests: true,
      workYears: true,
      appDomains: true,
      lastLoginAt: true,
      createdAt: true,
    },
  });

  if (!user) return NextResponse.json({ error: "用户不存在" }, { status: 404 });
  return NextResponse.json({ user });
}

export async function PUT(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const body = await req.json();
  const { name, phone, bio, profession, interests, workYears, isDeveloper, appDomains } = body;

  if (!name || !name.trim()) {
    return NextResponse.json({ error: "姓名不能为空" }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id: session.id },
    data: {
      name: name.trim(),
      phone: (phone || "").trim(),
      bio: bio || null,
      profession: profession || null,
      interests: interests || null,
      workYears: workYears != null && workYears !== "" ? Number(workYears) : null,
      isDeveloper: Boolean(isDeveloper),
      appDomains: isDeveloper ? appDomains || null : null,
    },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      bio: true,
      profession: true,
      interests: true,
      workYears: true,
      isDeveloper: true,
      appDomains: true,
    },
  });

  return NextResponse.json({ user: updated });
}

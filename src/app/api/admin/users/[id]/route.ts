import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import * as bcrypt from "bcryptjs";
import type { User } from "@prisma/client";

function serializeUser(user: User & { _count?: { apps: number; purchases: number } }) {
  return {
    ...user,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
    lastLoginAt: user.lastLoginAt?.toISOString() || null,
    lastPurchaseAt: user.lastPurchaseAt?.toISOString() || null,
    lastLevelCheckAt: user.lastLevelCheckAt?.toISOString() || null,
    resetTokenExp: user.resetTokenExp?.toISOString() || null,
  };
}

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
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        _count: { select: { apps: true, purchases: true } },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "用户不存在" }, { status: 404 });
    }

    return NextResponse.json({ user: serializeUser(user) });
  } catch (error) {
    console.error("Admin user detail error:", error);
    return NextResponse.json({ error: "获取用户信息失败" }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "无权限" }, { status: 403 });
    }

    const { id } = await params;
    const {
      name,
      email,
      phone,
      role,
      points,
      profession,
      interests,
      workYears,
      appDomains,
      bio,
      isDeveloper,
      password,
    } = await req.json();

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "用户不存在" }, { status: 404 });
    }

    if (email && email !== existing.email) {
      const conflict = await prisma.user.findUnique({ where: { email } });
      if (conflict) {
        return NextResponse.json({ error: "该邮箱已被使用" }, { status: 400 });
      }
    }

    if (phone && phone !== existing.phone) {
      const conflict = await prisma.user.findFirst({ where: { phone } });
      if (conflict) {
        return NextResponse.json({ error: "该手机号已被使用" }, { status: 400 });
      }
    }

    const data: Record<string, unknown> = {
      name,
      email,
      phone,
      role,
      points: typeof points === "number" ? points : Number(points),
      profession: profession || null,
      workYears: workYears ? Number(workYears) : null,
      bio: bio || null,
      isDeveloper: role === "DEVELOPER" || isDeveloper === true,
    };

    if (Array.isArray(interests)) {
      data.interests = interests.length ? JSON.stringify(interests) : null;
    } else if (interests !== undefined) {
      data.interests = interests || null;
    }

    if (Array.isArray(appDomains)) {
      data.appDomains = appDomains.length ? JSON.stringify(appDomains) : null;
    } else if (appDomains !== undefined) {
      data.appDomains = appDomains || null;
    }

    if (password && password.length > 0) {
      if (password.length < 6) {
        return NextResponse.json({ error: "密码至少 6 位" }, { status: 400 });
      }
      if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
        return NextResponse.json({ error: "密码需包含字母和数字" }, { status: 400 });
      }
      data.passwordHash = await bcrypt.hash(password, 10);
      data.tokenVersion = existing.tokenVersion + 1;
    }

    const user = await prisma.user.update({
      where: { id },
      data,
      include: {
        _count: { select: { apps: true, purchases: true } },
      },
    });

    return NextResponse.json({ ok: true, user: serializeUser(user) });
  } catch (error) {
    console.error("Admin user update error:", error);
    return NextResponse.json({ error: "保存失败" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { setSession } from "@/lib/auth";
import * as bcrypt from "bcryptjs";

const WELCOME_POINTS = 100;

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: "请填写完整信息" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "密码至少 6 位" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "该邮箱已注册" }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // First user becomes admin
    const userCount = await prisma.user.count();
    const role = userCount === 0 ? "ADMIN" : "USER";

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role,
        points: WELCOME_POINTS,
      },
    });

    // Record welcome points transaction
    await prisma.pointsTransaction.create({
      data: {
        userId: user.id,
        type: "RECHARGE",
        amount: WELCOME_POINTS,
        balanceAfter: WELCOME_POINTS,
        description: "新用户注册赠送",
      },
    });

    await setSession({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      points: user.points,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json({ error: "注册失败" }, { status: 500 });
  }
}

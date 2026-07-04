import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { setSession } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import * as bcrypt from "bcrypt";

const WELCOME_POINTS = 100;

export async function POST(req: Request) {
  try {
    // Rate limit check
    const rawIp = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
    const ip = rawIp === "unknown" ? rawIp : rawIp.split(",")[0].trim();
    const { allowed } = rateLimit(ip);
    if (!allowed) {
      return NextResponse.json({ error: "请求过于频繁，请稍后再试" }, { status: 429 });
    }

    const {
      name,
      email,
      password,
      phone,
      role,
      profession,
      interests,
      workYears,
      appDomains,
    } = await req.json();

    if (!name || !email || !password || !phone) {
      return NextResponse.json({ error: "请填写完整信息（昵称、邮箱、密码、手机号为必填）" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "密码至少 6 位" }, { status: 400 });
    }

    if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
      return NextResponse.json({ error: "密码需包含字母和数字" }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "邮箱格式不正确" }, { status: 400 });
    }

    // Validate phone format (Chinese mobile: 11 digits starting with 1)
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      return NextResponse.json({ error: "手机号格式不正确（需11位数字）" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "该邮箱已注册" }, { status: 400 });
    }

    // Check phone uniqueness (only for non-empty phone values)
    const existingPhone = await prisma.user.findFirst({ where: { phone } });
    if (existingPhone) {
      return NextResponse.json({ error: "该手机号已注册" }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // First user becomes admin, otherwise default to selected role
    const userCount = await prisma.user.count();
    let finalRole = "USER";
    if (userCount === 0) {
      finalRole = "ADMIN";
    } else if (role === "DEVELOPER") {
      finalRole = "DEVELOPER";
    }

    // 使用交互式事务确保用户创建和欢迎积分记录的原子性
    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          name,
          email,
          passwordHash,
          phone,
          role: finalRole,
          points: WELCOME_POINTS,
          isDeveloper: finalRole === "DEVELOPER",
          profession: profession || null,
          interests: Array.isArray(interests) ? JSON.stringify(interests) : (interests || null),
          workYears: workYears ? Number(workYears) : null,
          appDomains: Array.isArray(appDomains) ? JSON.stringify(appDomains) : (appDomains || null),
        },
      });

      await tx.pointsTransaction.create({
        data: {
          userId: newUser.id,
          type: "RECHARGE",
          amount: WELCOME_POINTS,
          balanceAfter: WELCOME_POINTS,
          description: "新用户注册赠送",
        },
      });

      return newUser;
    });

    await setSession({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      points: user.points,
      tokenVersion: user.tokenVersion,
    });

    return NextResponse.json({ ok: true, role: user.role });
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json({ error: "注册失败" }, { status: 500 });
  }
}

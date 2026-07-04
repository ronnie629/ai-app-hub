import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import * as bcrypt from "bcrypt";

export async function POST(req: Request) {
  try {
    // Rate limit to prevent brute-force attempts
    const rawIp = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
    const ip = rawIp === "unknown" ? rawIp : rawIp.split(",")[0].trim();
    const { allowed } = rateLimit(ip);
    if (!allowed) {
      return NextResponse.json({ error: "请求过于频繁，请稍后再试" }, { status: 429 });
    }

    const { token, password } = await req.json();

    if (!token || !password) {
      return NextResponse.json({ error: "请填写完整信息" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "密码至少 6 位" }, { status: 400 });
    }

    if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
      return NextResponse.json({ error: "密码需包含字母和数字" }, { status: 400 });
    }

    // Find user by reset token
    const user = await prisma.user.findUnique({
      where: { resetToken: token },
    });

    if (!user) {
      return NextResponse.json({ error: "重置链接无效" }, { status: 400 });
    }

    // Check if token has expired
    if (!user.resetTokenExp || user.resetTokenExp < new Date()) {
      // Clean up expired token
      await prisma.user.update({
        where: { id: user.id },
        data: { resetToken: null, resetTokenExp: null },
      });
      return NextResponse.json({ error: "重置链接已过期，请重新申请" }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // Reset password, clear reset token, and invalidate all existing sessions
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetToken: null,
        resetTokenExp: null,
        tokenVersion: { increment: 1 },
      },
    });

    return NextResponse.json({ ok: true, message: "密码重置成功，请使用新密码登录" });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json({ error: "密码重置失败，请稍后重试" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const rawIp = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
    const ip = rawIp === "unknown" ? rawIp : rawIp.split(",")[0].trim();
    const { allowed } = rateLimit(ip);
    if (!allowed) {
      return NextResponse.json({ error: "请求过于频繁，请稍后再试" }, { status: 429 });
    }

    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "请输入邮箱地址" }, { status: 400 });
    }

    // Don't reveal whether the email exists
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Still return success to prevent email enumeration
      return NextResponse.json({
        ok: true,
        message: "如果该邮箱已注册，重置链接将发送到您的邮箱",
      });
    }

    // Generate reset token (64 random bytes as hex = 128 chars)
    const resetToken = crypto.randomBytes(64).toString("hex");
    // Token expires in 1 hour
    const resetTokenExp = new Date(Date.now() + 60 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken, resetTokenExp },
    });

    // In production, send email with reset link here
    // For now, return the token directly (development mode)
    const resetUrl = `${req.headers.get("origin") || ""}/reset-password?token=${resetToken}`;

    console.log(`[DEV] Password reset link for ${email}: ${resetUrl}`);

    return NextResponse.json({
      ok: true,
      message: "如果该邮箱已注册，重置链接将发送到您的邮箱",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ error: "操作失败，请稍后重试" }, { status: 500 });
  }
}

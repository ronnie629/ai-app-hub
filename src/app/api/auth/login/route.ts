import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { setSession } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import * as bcrypt from "bcrypt";

export async function POST(req: Request) {
  try {
    // Rate limit check
    const rawIp = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
    // x-forwarded-for 可能包含多个 IP（多层代理），取第一个
    const ip = rawIp === "unknown" ? rawIp : rawIp.split(",")[0].trim();
    const { allowed } = rateLimit(ip);
    if (!allowed) {
      return NextResponse.json({ error: "请求过于频繁，请稍后再试" }, { status: 429 });
    }

    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "邮箱和密码不能为空" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    const valid = user ? await bcrypt.compare(password, user.passwordHash) : false;
    if (!user || !valid) {
      return NextResponse.json({ error: "邮箱或密码错误" }, { status: 401 });
    }

    // Update last login time
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    await setSession({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      points: user.points,
      tokenVersion: user.tokenVersion,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "登录失败" }, { status: 500 });
  }
}

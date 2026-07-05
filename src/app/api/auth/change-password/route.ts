import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, clearSession } from "@/lib/auth";
import * as bcrypt from "bcryptjs";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const { oldPassword, newPassword } = await req.json();

  if (!oldPassword || !newPassword) {
    return NextResponse.json({ error: "请填写完整" }, { status: 400 });
  }
  if (newPassword.length < 6) {
    return NextResponse.json({ error: "新密码至少 6 位" }, { status: 400 });
  }
  if (!/[a-zA-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
    return NextResponse.json({ error: "新密码需包含字母和数字" }, { status: 400 });
  }
  if (oldPassword === newPassword) {
    return NextResponse.json({ error: "新密码不能与旧密码相同" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.id } });
  if (!user) return NextResponse.json({ error: "用户不存在" }, { status: 404 });

  const valid = await bcrypt.compare(oldPassword, user.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: "原密码错误" }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  // Increment tokenVersion to invalidate all existing sessions
  await prisma.user.update({
    where: { id: session.id },
    data: { passwordHash, tokenVersion: { increment: 1 } },
  });

  // Clear current session cookie so user is forced to re-login
  await clearSession();

  return NextResponse.json({ ok: true, message: "密码已修改，请重新登录" });
}

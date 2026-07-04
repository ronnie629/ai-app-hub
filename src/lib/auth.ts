import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

const secretKey = process.env.AUTH_SECRET;
if (!secretKey) {
  throw new Error("AUTH_SECRET environment variable is required. Set it in .env before starting the app.");
}
const encodedKey = new TextEncoder().encode(secretKey);

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: string;
  points: number;
  tokenVersion: number;
}

export async function encrypt(payload: SessionUser) {
  return await new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(encodedKey);
}

export async function decrypt(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, encodedKey, {
      algorithms: ["HS256"],
    });
    return payload as unknown as SessionUser;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  if (!token) return null;
  const session = await decrypt(token);
  if (!session) return null;

  // Validate tokenVersion — if user changed password, old tokens are invalid.
  // 如果数据库不可用，不回退到 JWT 数据（不做降级），避免安全风险。
  // 而是直接返回 null，让调用方处理未认证状态。
  try {
    const user = await prisma.user.findUnique({ where: { id: session.id }, select: { tokenVersion: true } });
    if (!user || user.tokenVersion !== session.tokenVersion) {
      return null;
    }
  } catch (dbError) {
    // 数据库不可用时（比如表不存在），无法验证 tokenVersion
    // 保守策略：拒绝本次 session，前端会显示未登录状态，提示用户刷新
    console.error("getSession: DB query failed, session rejected:", String(dbError));
    return null;
  }

  return session;
}

export async function setSession(user: SessionUser) {
  const token = await encrypt(user);
  const cookieStore = await cookies();
  // secure cookie 仅在 HTTPS 环境下启用，HTTP 环境下设置会导致浏览器拒绝 cookie。
  // 部署时如需启用 secure，请在 .env 中设置 FORCE_SECURE_COOKIE=true
  cookieStore.set("session", token, {
    httpOnly: true,
    secure: process.env.FORCE_SECURE_COOKIE === "true",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete("session");
}

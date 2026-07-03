import { jwtVerify } from "jose";
import type { NextRequest } from "next/server";

const secretKey = process.env.AUTH_SECRET;
if (!secretKey) {
  throw new Error(
    "AUTH_SECRET environment variable is required. Set it in .env before starting the app."
  );
}
const encodedKey = new TextEncoder().encode(secretKey);

export interface EdgeSessionUser {
  id: string;
  email: string;
  name: string;
  role: string;
  points: number;
  tokenVersion: number;
}

/**
 * Edge-compatible session check — JWT verification only, no Prisma.
 *
 * Used in middleware (Edge Runtime) where Prisma Client cannot run
 * (no native TCP support). This function does NOT validate tokenVersion
 * against the database. API routes that need full validation should call
 * getSession() from auth.ts instead.
 */
export async function getEdgeSession(
  request: NextRequest
): Promise<EdgeSessionUser | null> {
  const token = request.cookies.get("session")?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, encodedKey, {
      algorithms: ["HS256"],
    });
    return payload as unknown as EdgeSessionUser;
  } catch {
    return null;
  }
}

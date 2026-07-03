import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getEdgeSession } from "@/lib/edge-auth";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 需要认证的页面路由
  const protectedRoutes = [
    "/dashboard",
    "/app/publish",
    "/my-apps",
    "/favorites",
    "/profile",
  ];

  // 公开 API 路由（不需要登录即可访问，子路由也放行）
  const publicApiRoutes = [
    "/api/auth/login",
    "/api/auth/register",
    "/api/apps",
    "/api/categories",
  ];

  const isProtectedRoute = protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );

  const isApiRoute = pathname.startsWith("/api/");
  const isPublicApi = publicApiRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );

  // Edge-compatible session check (JWT only, no Prisma)
  const session = await getEdgeSession(request);

  // 保护路由：未登录则重定向到登录页
  if (isProtectedRoute && !session) {
    const url = new URL("/login", request.url);
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  // API 路由：未登录返回 401（公开的除外）
  if (isApiRoute && !isPublicApi && !session) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  // 已登录用户访问登录/注册页，重定向到首页
  if ((pathname === "/login" || pathname === "/register") && session) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/app/publish",
    "/my-apps/:path*",
    "/favorites/:path*",
    "/profile/:path*",
    "/login",
    "/register",
    "/api/:path*",
  ],
};

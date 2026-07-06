"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { MobileSidebar } from "./mobile-sidebar";

interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: string;
  points: number;
  unreadCount?: number;
}

export function Navbar() {
  const pathname = usePathname();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const fetchUser = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      setUser(data.user || null);
    } catch {
      // Silent fail — default to not logged in
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications/unread-count");
      const data = await res.json();
      setUnreadCount(data.count || 0);
    } catch {
      // Silent fail
    }
  }, []);

  // Fetch on mount and on pathname change (covers login→dashboard, logout→home, etc.)
  useEffect(() => {
    fetchUser();
    if (user) fetchUnreadCount();
  }, [fetchUser, fetchUnreadCount, pathname, user]);

  // Listen for custom auth events (login/logout/points change)
  useEffect(() => {
    const handler = () => {
      fetchUser();
      fetchUnreadCount();
    };
    window.addEventListener("auth-change", handler);
    return () => window.removeEventListener("auth-change", handler);
  }, [fetchUser, fetchUnreadCount]);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = () => setMenuOpen(false);
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [menuOpen]);

  const navLinks = [
    { href: "/", label: "首页" },
    { href: "/market", label: "应用市场" },
    { href: "/publish", label: "发布应用" },
  ];

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    setMenuOpen(false);
    window.dispatchEvent(new Event("auth-change"));
    window.location.href = "/";
  };

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-gray-200 glass">
        <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
          <div className="flex h-14 sm:h-16 items-center justify-between">
            {/* Hamburger + Logo */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Hamburger button - mobile only */}
              <button
                onClick={() => setSidebarOpen(true)}
                className="inline-flex md:hidden items-center justify-center rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 -ml-1"
                aria-label="菜单"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              <Link href="/" className="flex items-center gap-2">
                <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white font-bold text-base sm:text-lg">
                  A
                </div>
                <span className="text-lg sm:text-xl font-bold gradient-text">AIHub</span>
              </Link>
            </div>

            {/* Nav links - desktop only */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${
                    pathname === link.href
                      ? "bg-indigo-50 text-indigo-600"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* User area */}
            <div className="flex items-center gap-2 sm:gap-3">
              {loading ? (
                /* Skeleton while loading — no flash of login/register buttons */
                <div className="flex items-center gap-2">
                  <div className="h-8 w-20 rounded-lg bg-gray-100 animate-pulse" />
                  <div className="h-8 w-20 rounded-lg bg-gray-100 animate-pulse" />
                </div>
              ) : user ? (
                <>

                  {/* Points - hidden on smallest phones */}
                  <Link
                    href="/dashboard"
                    className="hidden xs:flex items-center gap-1 rounded-lg bg-amber-50 px-2 sm:px-3 py-1.5 text-sm hover:bg-amber-100"
                    title="我的积分"
                  >
                    <span className="text-amber-500">⚡</span>
                    <span className="font-semibold text-amber-700">{user.points}</span>
                  </Link>
                  {user.role === "ADMIN" && (
                    <Link
                      href="/admin"
                      className="hidden sm:inline-flex items-center rounded-lg px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100"
                    >
                      管理
                    </Link>
                  )}

                  {/* User menu */}
                  <div className="relative" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => setMenuOpen((v) => !v)}
                      className="flex items-center gap-2 rounded-lg hover:bg-gray-100 px-1.5 sm:px-2 py-1.5"
                    >
                      <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 text-white text-sm font-medium">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="hidden sm:inline text-sm font-medium text-gray-700">
                        {user.name}
                      </span>
                      <svg className="hidden sm:inline h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {menuOpen && (
                      <div className="absolute right-0 mt-2 w-56 rounded-xl border border-gray-200 bg-white shadow-lg py-1 z-50">
                        <div className="px-4 py-3 border-b border-gray-100">
                          <p className="text-sm font-medium text-gray-900">{user.name}</p>
                          <p className="text-xs text-gray-500 truncate">{user.email}</p>
                        </div>
                        <Link
                          href="/dashboard/notifications"
                          onClick={() => setMenuOpen(false)}
                          className="flex items-center justify-between px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <span>消息通知</span>
                          {unreadCount > 0 && (
                            <span className="ml-2 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-semibold text-white">
                              {unreadCount > 99 ? "99+" : unreadCount}
                            </span>
                          )}
                        </Link>
                        <Link
                          href="/dashboard"
                          onClick={() => setMenuOpen(false)}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          控制台
                        </Link>
                        <Link
                          href="/dashboard/profile"
                          onClick={() => setMenuOpen(false)}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          个人资料
                        </Link>
                        <Link
                          href="/dashboard/apps"
                          onClick={() => setMenuOpen(false)}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          我的应用
                        </Link>
                        <Link
                          href="/dashboard/favorites"
                          onClick={() => setMenuOpen(false)}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          我的收藏
                        </Link>
                        <Link
                          href="/dashboard/points"
                          onClick={() => setMenuOpen(false)}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          积分充值
                        </Link>
                        <div className="my-1 border-t border-gray-100" />
                        <button
                          onClick={handleLogout}
                          className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                          退出登录
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="rounded-lg px-3 sm:px-4 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                  >
                    登录
                  </Link>
                  <Link
                    href="/register"
                    className="rounded-lg bg-indigo-600 px-3 sm:px-4 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
                  >
                    注册
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Mobile nav - removed, using sidebar + bottom nav instead */}
        </div>
      </header>

      {/* Mobile sidebar (hamburger menu) */}
      <MobileSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
    </>
  );
}

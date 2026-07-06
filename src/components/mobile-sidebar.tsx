"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useCallback } from "react";

interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: string;
  points: number;
}

interface MobileSidebarProps {
  open: boolean;
  onClose: () => void;
}

export function MobileSidebar({ open, onClose }: MobileSidebarProps) {
  const pathname = usePathname();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      setUser(data.user || null);
    } catch {
      // Silent fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
    const handler = () => fetchUser();
    window.addEventListener("auth-change", handler);
    return () => window.removeEventListener("auth-change", handler);
  }, [fetchUser]);

  // Close on route change
  useEffect(() => {
    onClose();
  }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    window.dispatchEvent(new Event("auth-change"));
    window.location.href = "/";
  };

  const navLinks = [
    { href: "/", label: "首页" },
    { href: "/market", label: "应用市场" },
    { href: "/publish", label: "发布应用" },
  ];

  const userLinks = [
    { href: "/dashboard", label: "控制台" },
    { href: "/dashboard/apps", label: "我的应用" },
    { href: "/dashboard/favorites", label: "我的收藏" },
    { href: "/dashboard/notifications", label: "消息通知" },
    { href: "/dashboard/points", label: "积分充值" },
    { href: "/dashboard/profile", label: "个人资料" },
    { href: "/dashboard/earnings", label: "收入记录" },
  ];

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm transition-opacity md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out md:hidden ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <Link href="/" className="flex items-center gap-2" onClick={onClose}>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white font-bold text-lg">
              A
            </div>
            <span className="text-xl font-bold gradient-text">AIHub</span>
          </Link>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto h-full pb-24">
          {/* User info */}
          {loading ? (
            <div className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-gray-100 animate-pulse" />
                <div className="space-y-2">
                  <div className="h-4 w-24 rounded bg-gray-100 animate-pulse" />
                  <div className="h-3 w-32 rounded bg-gray-100 animate-pulse" />
                </div>
              </div>
            </div>
          ) : user ? (
            <div className="p-4 border-b border-gray-100">
              <Link
                href="/dashboard"
                className="flex items-center gap-3 group"
                onClick={onClose}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 text-white text-lg font-medium shrink-0">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-indigo-600">{user.name}</p>
                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                </div>
              </Link>
              <div className="mt-3 flex items-center gap-2">
                <Link
                  href="/dashboard/points"
                  className="flex-1 rounded-lg bg-amber-50 px-3 py-2 text-center text-sm"
                  onClick={onClose}
                >
                  <span className="font-bold text-amber-700">{user.points}</span>
                  <span className="text-amber-500 ml-1">⚡</span>
                </Link>
                {user.role === "ADMIN" && (
                  <Link
                    href="/admin"
                    className="rounded-lg bg-indigo-50 px-3 py-2 text-sm font-medium text-indigo-600"
                    onClick={onClose}
                  >
                    管理
                  </Link>
                )}
              </div>
            </div>
          ) : (
            <div className="p-4 border-b border-gray-100">
              <Link
                href="/login"
                className="block w-full rounded-xl bg-indigo-600 px-4 py-3 text-center text-sm font-semibold text-white"
                onClick={onClose}
              >
                登录 / 注册
              </Link>
            </div>
          )}

          {/* Nav links */}
          <div className="p-3">
            <p className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">导航</p>
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={onClose}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium ${
                  pathname === link.href
                    ? "bg-indigo-50 text-indigo-600"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* User menu */}
          {user && (
            <div className="p-3">
              <p className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">我的</p>
              {userLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={onClose}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium ${
                    pathname === link.href
                      ? "bg-indigo-50 text-indigo-600"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <div className="my-2 border-t border-gray-100" />
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50"
              >
                退出登录
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

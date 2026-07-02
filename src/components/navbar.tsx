"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: string;
  points: number;
}

export function Navbar() {
  const pathname = usePathname();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) setUser(data.user);
      })
      .finally(() => setLoading(false));
  }, [pathname]);

  const navLinks = [
    { href: "/", label: "首页" },
    { href: "/market", label: "应用市场" },
    { href: "/publish", label: "发布应用" },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 glass">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white font-bold text-lg">
              A
            </div>
            <span className="text-xl font-bold gradient-text">AIHub</span>
          </Link>

          {/* Nav links */}
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
          <div className="flex items-center gap-3">
            {loading ? (
              <div className="h-8 w-20 rounded-lg bg-gray-100 animate-pulse" />
            ) : user ? (
              <>
                <div className="flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-1.5 text-sm">
                  <span className="text-amber-500">⚡</span>
                  <span className="font-semibold text-amber-700">{user.points}</span>
                </div>
                {user.role === "ADMIN" && (
                  <Link
                    href="/admin"
                    className="hidden sm:inline-flex items-center rounded-lg px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100"
                  >
                    管理
                  </Link>
                )}
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2 rounded-lg hover:bg-gray-100 px-2 py-1.5"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 text-white text-sm font-medium">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden sm:inline text-sm font-medium text-gray-700">
                    {user.name}
                  </span>
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="rounded-lg px-4 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100"
                >
                  登录
                </Link>
                <Link
                  href="/register"
                  className="rounded-lg bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
                >
                  注册
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Mobile nav */}
        <nav className="flex md:hidden items-center gap-1 pb-3">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                pathname === link.href
                  ? "bg-indigo-50 text-indigo-600"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

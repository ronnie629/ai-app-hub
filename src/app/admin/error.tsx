"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Admin page error:", error);
  }, [error]);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24 text-center">
      <div className="text-6xl mb-4">⚙️</div>
      <h1 className="text-2xl font-bold mb-2">管理后台遇到问题</h1>
      <p className="text-gray-500 mb-6 max-w-md mx-auto">
        可能是数据库未初始化或网络问题。
        <br />
        请确认已在服务器上执行 <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono">npx prisma db push</code> 创建数据表。
      </p>
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={reset}
          className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          重试
        </button>
        <Link
          href="/"
          className="rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          回到首页
        </Link>
      </div>
    </div>
  );
}

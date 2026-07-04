"use client";

import Link from "next/link";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-24 text-center">
      <div className="text-6xl mb-4">👤</div>
      <h1 className="text-3xl font-bold mb-2">用户信息加载失败</h1>
      <p className="text-gray-500 mb-8">用户资料加载出错，请稍后重试</p>
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

import Link from "next/link";
import { Navbar } from "@/components/navbar";

export default function NotFound() {
  return (
    <>
      <Navbar />
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <div className="text-6xl mb-4">🤖</div>
        <h1 className="text-3xl font-bold mb-2">页面走丢了</h1>
        <p className="text-gray-500 mb-8">404 - 你访问的页面不存在或已被移除</p>
        <div className="flex items-center justify-center gap-3">
          <Link
            href="/"
            className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            回到首页
          </Link>
          <Link
            href="/market"
            className="rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            浏览应用
          </Link>
        </div>
      </div>
    </>
  );
}

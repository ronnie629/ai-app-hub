"use client";

import { useState } from "react";
import Link from "next/link";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetUrl, setResetUrl] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/auth/forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(data.message || "重置链接已发送");
        if (data.resetUrl) {
          setResetUrl(data.resetUrl);
        }
      } else {
        setError(data.error || "操作失败");
      }
    } catch {
      setError("网络错误，请重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">注册邮箱</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
        />
      </div>
      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-600">{error}</div>
      )}
      {success && (
        <div className="rounded-lg bg-green-50 px-4 py-2.5 text-sm text-green-600">
          {success}
        </div>
      )}
      {resetUrl && (
        <div className="rounded-lg bg-indigo-50 px-4 py-3 text-xs">
          <p className="font-medium text-indigo-700 mb-1">开发环境 - 重置链接：</p>
          <a
            href={resetUrl}
            className="text-indigo-600 break-all hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            {resetUrl}
          </a>
        </div>
      )}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-indigo-600 px-4 py-3.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 active:scale-[0.98] transition-transform"
      >
        {loading ? "发送中..." : "发送重置链接"}
      </button>
      <p className="text-center text-sm text-gray-400">
        <Link href="/login" className="text-indigo-600 hover:underline">
          返回登录
        </Link>
      </p>
    </form>
  );
}

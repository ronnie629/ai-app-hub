"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export function RegisterForm() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password.length < 6) {
      setError("密码至少 6 位");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        router.push("/dashboard");
        router.refresh();
      } else {
        setError(data.error || "注册失败");
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
        <label className="block text-sm font-medium text-gray-700 mb-1.5">昵称</label>
        <input
          type="text"
          required
          maxLength={20}
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="你的昵称"
          className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">邮箱</label>
        <input
          type="email"
          required
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          placeholder="you@example.com"
          className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">密码</label>
        <input
          type="password"
          required
          minLength={6}
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          placeholder="至少 6 位"
          className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
        />
      </div>
      <div className="rounded-lg bg-indigo-50 px-4 py-3 text-xs text-indigo-600">
        新用户注册即送 <strong>100 积分</strong>，可用于购买平台上的 AI 应用。
      </div>
      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-600">{error}</div>
      )}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
      >
        {loading ? "注册中..." : "注册"}
      </button>
      <p className="text-center text-sm text-gray-400">
        已有账号？{" "}
        <Link href="/login" className="text-indigo-600 hover:underline">
          去登录
        </Link>
      </p>
    </form>
  );
}

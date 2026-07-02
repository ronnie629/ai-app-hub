"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface PublishFormProps {
  categories: { key: string; label: string; icon: string }[];
  appTypes: { key: string; label: string; desc: string }[];
}

export function PublishForm({ categories, appTypes }: PublishFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [tagsInput, setTagsInput] = useState("");

  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "效率工具",
    appType: "WEB",
    coverImage: "",
    price: 0,
    usageInstructions: "",
    accessUrl: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage("");

    // Parse tags
    const tags = tagsInput
      .split(/[,，\s]+/)
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 10);

    try {
      const res = await fetch("/api/apps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, tags }),
      });
      const data = await res.json();
      if (res.ok) {
        router.push("/dashboard/apps");
      } else {
        setMessage(data.error || "发布失败");
      }
    } catch {
      setMessage("网络错误，请重试");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          应用名称 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          required
          maxLength={50}
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder="给你的 AI 应用起个名字"
          className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          应用描述 <span className="text-red-500">*</span>
        </label>
        <textarea
          required
          rows={4}
          maxLength={500}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="简要描述你的应用功能、特点和使用场景"
          className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
        />
      </div>

      {/* Category & Type */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            分类 <span className="text-red-500">*</span>
          </label>
          <select
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none"
          >
            {categories.map((cat) => (
              <option key={cat.key} value={cat.key}>
                {cat.icon} {cat.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            应用类型 <span className="text-red-500">*</span>
          </label>
          <select
            value={form.appType}
            onChange={(e) => setForm({ ...form, appType: e.target.value })}
            className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none"
          >
            {appTypes.map((type) => (
              <option key={type.key} value={type.key}>
                {type.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* App type hint */}
      <div className="rounded-lg bg-gray-50 px-4 py-2.5 text-xs text-gray-500">
        {appTypes.find((t) => t.key === form.appType)?.desc}
      </div>

      {/* Cover image URL */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          封面图片 URL
        </label>
        <input
          type="url"
          value={form.coverImage}
          onChange={(e) => setForm({ ...form, coverImage: e.target.value })}
          placeholder="https://example.com/cover.png（留空将使用默认封面）"
          className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
        />
      </div>

      {/* Access URL */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          访问地址
        </label>
        <input
          type="url"
          value={form.accessUrl}
          onChange={(e) => setForm({ ...form, accessUrl: e.target.value })}
          placeholder="https://your-app-url.com（用户购买后可访问）"
          className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
        />
      </div>

      {/* Price */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          定价（积分）<span className="text-red-500">*</span>
        </label>
        <div className="flex items-center gap-3">
          <span className="text-amber-500 text-lg">⚡</span>
          <input
            type="number"
            required
            min={0}
            max={100000}
            value={form.price}
            onChange={(e) => setForm({ ...form, price: parseInt(e.target.value) || 0 })}
            className="w-40 rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
          />
          <span className="text-sm text-gray-400">
            {form.price === 0 ? "免费应用" : `用户需支付 ${form.price} 积分`}
          </span>
        </div>
        <p className="mt-1.5 text-xs text-gray-400">填 0 表示免费。平台默认抽取 10% 作为服务费。</p>
      </div>

      {/* Tags */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          标签
        </label>
        <input
          type="text"
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
          placeholder="用逗号分隔，如：GPT, 写作, 自动化（最多10个）"
          className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
        />
      </div>

      {/* Usage instructions */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          使用说明
        </label>
        <textarea
          rows={4}
          value={form.usageInstructions}
          onChange={(e) => setForm({ ...form, usageInstructions: e.target.value })}
          placeholder="详细的使用步骤、注意事项等（购买后可见）"
          className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
        />
      </div>

      {/* Message */}
      {message && (
        <div className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-600">
          {message}
        </div>
      )}

      {/* Submit */}
      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-xl bg-indigo-600 px-8 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {submitting ? "提交中..." : "提交审核"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-xl border border-gray-300 px-6 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50"
        >
          取消
        </button>
      </div>
      <p className="text-xs text-gray-400">提交后需等待管理员审核，审核通过后将在应用市场展示。</p>
    </form>
  );
}

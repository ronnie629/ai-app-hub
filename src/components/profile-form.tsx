"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface ProfileFormUser {
  id: string;
  email: string;
  name: string;
  phone: string;
  bio: string | null;
  profession: string | null;
  interests: string | null;
  workYears: number | null;
  isDeveloper: boolean;
  appDomains: string | null;
}

const INTEREST_OPTIONS = [
  "AI 写作", "AI 绘画", "AI 编程", "AI 视频", "AI 音频",
  "效率工具", "教育学习", "工作办公", "生活娱乐", "投资理财",
];

export function ProfileForm({ user }: { user: ProfileFormUser }) {
  const router = useRouter();
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone);
  const [bio, setBio] = useState(user.bio || "");
  const [profession, setProfession] = useState(user.profession || "");
  const [workYears, setWorkYears] = useState<string>(user.workYears?.toString() || "");
  const [interests, setInterests] = useState<string[]>(
    user.interests ? user.interests.split(",").filter(Boolean) : []
  );
  const [isDeveloper, setIsDeveloper] = useState(user.isDeveloper);
  const [appDomains, setAppDomains] = useState(user.appDomains || "");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const toggleInterest = (interest: string) => {
    setInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone,
          bio: bio || null,
          profession: profession || null,
          interests: interests.length ? interests.join(",") : null,
          workYears: workYears || null,
          isDeveloper,
          appDomains: isDeveloper ? appDomains || null : null,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: "ok", text: "保存成功" });
        router.refresh();
      } else {
        setMessage({ type: "err", text: data.error || "保存失败" });
      }
    } catch {
      setMessage({ type: "err", text: "网络错误，请重试" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">姓名 *</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">电话</label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            placeholder="请输入手机号"
            className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">个人简介</label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={3}
          maxLength={200}
          placeholder="一句话介绍一下自己（200 字以内）"
          className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">职业</label>
          <input
            value={profession}
            onChange={(e) => setProfession(e.target.value)}
            placeholder="如：产品经理 / 设计师"
            className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">工作年限</label>
          <input
            type="number"
            min={0}
            max={50}
            value={workYears}
            onChange={(e) => setWorkYears(e.target.value)}
            placeholder="如：3"
            className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">兴趣爱好</label>
        <div className="flex flex-wrap gap-2">
          {INTEREST_OPTIONS.map((opt) => {
            const selected = interests.includes(opt);
            return (
              <button
                type="button"
                key={opt}
                onClick={() => toggleInterest(opt)}
                className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
                  selected
                    ? "bg-indigo-600 border-indigo-600 text-white"
                    : "bg-white border-gray-300 text-gray-600 hover:border-indigo-400"
                }`}
              >
                {opt}
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 p-4 bg-gray-50">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={isDeveloper}
            onChange={(e) => setIsDeveloper(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
          <span className="text-sm font-medium text-gray-700">我是 AI 开发者</span>
        </label>

        {isDeveloper && (
          <div className="mt-3">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">擅长的应用领域</label>
            <textarea
              value={appDomains}
              onChange={(e) => setAppDomains(e.target.value)}
              rows={2}
              maxLength={300}
              placeholder="如：自然语言处理、计算机视觉、语音识别..."
              className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 bg-white"
            />
          </div>
        )}
      </div>

      {message && (
        <div
          className={`rounded-lg px-4 py-2.5 text-sm ${
            message.type === "ok" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? "保存中..." : "保存修改"}
        </button>
      </div>
    </form>
  );
}

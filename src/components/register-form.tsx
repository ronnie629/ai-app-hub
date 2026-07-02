"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const PROFESSIONS = [
  "学生",
  "产品经理",
  "设计师",
  "前端开发",
  "后端开发",
  "全栈开发",
  "AI/机器学习工程师",
  "数据科学家",
  "运维/DevOps",
  "创业者",
  "投资人",
  "其他",
];

const INTEREST_OPTIONS = [
  "AI 聊天助手",
  "AI 图像生成",
  "AI 视频生成",
  "AI 写作工具",
  "AI 编程助手",
  "AI 音频处理",
  "数据分析",
  "自动化办公",
  "知识管理",
  "其他",
];

const WORK_YEAR_OPTIONS = [
  { label: "在校/实习", value: 0 },
  { label: "1年以下", value: 1 },
  { label: "1-3年", value: 3 },
  { label: "3-5年", value: 5 },
  { label: "5-10年", value: 10 },
  { label: "10年以上", value: 15 },
];

const APP_DOMAIN_OPTIONS = [
  "AI 聊天对话",
  "AI 图像/设计",
  "AI 视频创作",
  "AI 音频/音乐",
  "AI 写作/文案",
  "AI 编程/代码",
  "AI 数据分析",
  "AI 办公自动化",
  "AI 教育学习",
  "AI 生活娱乐",
];

export function RegisterForm() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [accountType, setAccountType] = useState<"USER" | "DEVELOPER">("USER");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    profession: "",
    interests: [] as string[],
    workYears: 0,
    appDomains: [] as string[],
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const toggleInterest = (item: string) => {
    setForm((f) => ({
      ...f,
      interests: f.interests.includes(item)
        ? f.interests.filter((i) => i !== item)
        : [...f.interests, item],
    }));
  };

  const toggleAppDomain = (item: string) => {
    setForm((f) => ({
      ...f,
      appDomains: f.appDomains.includes(item)
        ? f.appDomains.filter((i) => i !== item)
        : [...f.appDomains, item],
    }));
  };

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
        body: JSON.stringify({
          ...form,
          role: accountType,
          workYears: form.workYears,
        }),
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
    <form onSubmit={handleSubmit}>
      {/* Account type selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">注册身份</label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setAccountType("USER")}
            className={`rounded-xl border-2 px-4 py-3 text-sm font-medium transition-all ${
              accountType === "USER"
                ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                : "border-gray-200 text-gray-600 hover:border-gray-300"
            }`}
          >
            <div className="text-base font-semibold">普通用户</div>
            <div className="text-xs mt-0.5 opacity-70">浏览、购买 AI 应用</div>
          </button>
          <button
            type="button"
            onClick={() => setAccountType("DEVELOPER")}
            className={`rounded-xl border-2 px-4 py-3 text-sm font-medium transition-all ${
              accountType === "DEVELOPER"
                ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                : "border-gray-200 text-gray-600 hover:border-gray-300"
            }`}
          >
            <div className="text-base font-semibold">AI 开发者</div>
            <div className="text-xs mt-0.5 opacity-70">发布并销售 AI 应用</div>
          </button>
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-6">
        <button
          type="button"
          onClick={() => setStep(1)}
          className={`flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full ${
            step >= 1 ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-400"
          }`}
        >
          <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[10px]">1</span>
          基础信息
        </button>
        <div className={`flex-1 h-px ${step >= 2 ? "bg-indigo-400" : "bg-gray-200"}`} />
        <button
          type="button"
          onClick={() => setStep(2)}
          className={`flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full ${
            step >= 2 ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-400"
          }`}
        >
          <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[10px]">2</span>
          选填信息
        </button>
      </div>

      {/* Step 1: Basic info */}
      {step === 1 && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              昵称 <span className="text-red-500">*</span>
            </label>
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
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              手机号码 <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              required
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="请输入手机号"
              className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              邮箱 <span className="text-red-500">*</span>
            </label>
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
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              密码 <span className="text-red-500">*</span>
            </label>
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

          <button
            type="button"
            onClick={() => setStep(2)}
            className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            下一步：完善资料
          </button>
        </div>
      )}

      {/* Step 2: Optional info */}
      {step === 2 && (
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">职业</label>
            <select
              value={form.profession}
              onChange={(e) => setForm({ ...form, profession: e.target.value })}
              className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 bg-white"
            >
              <option value="">请选择职业（选填）</option>
              {PROFESSIONS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">工作年限</label>
            <div className="flex flex-wrap gap-2">
              {WORK_YEAR_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setForm({ ...form, workYears: opt.value })}
                  className={`rounded-full px-3 py-1 text-xs font-medium border transition-all ${
                    form.workYears === opt.value
                      ? "border-indigo-600 bg-indigo-50 text-indigo-600"
                      : "border-gray-200 text-gray-500 hover:border-gray-300"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">感兴趣的 AI 领域</label>
            <div className="flex flex-wrap gap-2">
              {INTEREST_OPTIONS.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => toggleInterest(item)}
                  className={`rounded-full px-3 py-1 text-xs font-medium border transition-all ${
                    form.interests.includes(item)
                      ? "border-indigo-600 bg-indigo-50 text-indigo-600"
                      : "border-gray-200 text-gray-500 hover:border-gray-300"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          {accountType === "DEVELOPER" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                擅长的 AI 应用领域 <span className="text-xs text-gray-400 font-normal">（开发者专属）</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {APP_DOMAIN_OPTIONS.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => toggleAppDomain(item)}
                    className={`rounded-full px-3 py-1 text-xs font-medium border transition-all ${
                      form.appDomains.includes(item)
                        ? "border-purple-600 bg-purple-50 text-purple-600"
                        : "border-gray-200 text-gray-500 hover:border-gray-300"
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-600">{error}</div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="flex-1 rounded-xl border border-gray-300 px-4 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              上一步
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-[2] rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? "注册中..." : "完成注册"}
            </button>
          </div>
        </div>
      )}

      <p className="text-center text-sm text-gray-400 mt-4">
        已有账号？{" "}
        <Link href="/login" className="text-indigo-600 hover:underline">
          去登录
        </Link>
      </p>
    </form>
  );
}

"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ImageUploader, UploadedImage } from "@/components/image-uploader";
import { BUCKETS } from "@/lib/storage";
import { CATEGORIES, APP_TYPES, formatPoints } from "@/lib/constants";

interface PublishFormProps {
  categories: { key: string; label: string; icon: string }[];
  appTypes: { key: string; label: string; desc: string }[];
}

type StepKey = "basic" | "media" | "pricing" | "preview";

const STEPS: { key: StepKey; label: string; desc: string }[] = [
  { key: "basic", label: "基础信息", desc: "名称、描述、分类" },
  { key: "media", label: "媒体资源", desc: "封面、截图" },
  { key: "pricing", label: "定价权益", desc: "积分定价、访问方式" },
  { key: "preview", label: "预览发布", desc: "确认信息、提交" },
];

// 定价档位建议
const PRICE_SUGGESTIONS = [
  { value: 0, label: "免费", desc: "完全开放，扩大用户基数" },
  { value: 10, label: "10 积分", desc: "轻度付费，走量" },
  { value: 39, label: "39 积分", desc: "标准付费，应用市场主流价位" },
  { value: 99, label: "99 积分", desc: "中高端，专业工具" },
  { value: 299, label: "299 积分", desc: "高端，深度专业应用" },
];

const DRAFT_KEY = "aihub:publish-draft:v2";

interface FormState {
  title: string;
  description: string;
  category: string;
  appType: string;
  tags: string[];
  coverImage: UploadedImage | null;
  screenshots: UploadedImage[];
  price: number;
  accessUrl: string;
  usageInstructions: string;
}

function emptyForm(): FormState {
  return {
    title: "",
    description: "",
    category: CATEGORIES[0].key,
    appType: APP_TYPES[0].key,
    tags: [],
    coverImage: null,
    screenshots: [],
    price: 0,
    accessUrl: "",
    usageInstructions: "",
  };
}

export function PublishForm({ categories, appTypes }: PublishFormProps) {
  const router = useRouter();
  const [step, setStep] = useState<StepKey>("basic");
  const [submitting, setSubmitting] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [draftRestored, setDraftRestored] = useState(false);
  const [tagsInput, setTagsInput] = useState("");
  const [aiPrompt, setAiPrompt] = useState("");

  const [form, setForm] = useState<FormState>(emptyForm);

  // 加载草稿
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const draft = JSON.parse(raw);
        setForm({ ...emptyForm(), ...draft.form });
        setTagsInput(draft.tagsInput || "");
        setStep(draft.step || "basic");
        setDraftRestored(true);
      }
    } catch {
      // ignore
    }
  }, []);

  // 自动保存草稿
  useEffect(() => {
    if (!draftRestored && form === emptyForm()) return; // 首次空状态不保存
    const id = setTimeout(() => {
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify({ form, tagsInput, step, ts: Date.now() }));
      } catch {
        // ignore quota
      }
    }, 800);
    return () => clearTimeout(id);
  }, [form, tagsInput, step, draftRestored]);

  const clearDraft = () => {
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch {
      // ignore
    }
  };

  // 校验每步是否完成
  const stepValid = useMemo(() => {
    return {
      basic: form.title.trim().length > 0 && form.description.trim().length >= 10,
      media: true, // 媒体可选
      pricing: form.price >= 0,
      preview: true,
    };
  }, [form]);

  const allValid = stepValid.basic && stepValid.pricing;

  const stepIndex = STEPS.findIndex((s) => s.key === step);
  const goNext = () => {
    if (stepIndex < STEPS.length - 1) {
      setStep(STEPS[stepIndex + 1].key);
    }
  };
  const goPrev = () => {
    if (stepIndex > 0) {
      setStep(STEPS[stepIndex - 1].key);
    }
  };

  // AI 一句话生成
  const handleAiGenerate = async () => {
    if (!aiPrompt.trim()) {
      setError("请先描述你的应用");
      return;
    }
    setError("");
    setAiGenerating(true);
    try {
      const res = await fetch("/api/ai/generate-app", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: aiPrompt }),
      });
      const data = await res.json();
      if (res.ok && data.result) {
        const r = data.result;
        setForm((prev) => ({
          ...prev,
          title: r.title || prev.title,
          description: r.description || prev.description,
          category: r.category || prev.category,
          appType: r.appType || prev.appType,
        }));
        if (Array.isArray(r.tags)) {
          setTagsInput(r.tags.join(", "));
        }
      } else {
        setError(data.error || "AI 生成失败，请稍后重试");
      }
    } catch {
      setError("网络错误，AI 生成失败");
    } finally {
      setAiGenerating(false);
    }
  };

  // 解析标签输入
  const parsedTags = useMemo(
    () =>
      tagsInput
        .split(/[,，\s]+/)
        .map((t) => t.trim())
        .filter(Boolean)
        .slice(0, 10),
    [tagsInput]
  );

  // 提交
  const handleSubmit = async () => {
    if (!allValid) {
      setError("请完成必填项");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/apps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          category: form.category,
          appType: form.appType,
          coverImage: form.coverImage?.url || "",
          screenshots: form.screenshots,
          price: form.price,
          accessUrl: form.accessUrl,
          usageInstructions: form.usageInstructions,
          tags: parsedTags,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        clearDraft();
        setSuccessMsg("发布成功！跳转中...");
        setTimeout(() => router.push("/dashboard/apps"), 800);
      } else {
        setError(data.error || "发布失败");
      }
    } catch {
      setError("网络错误");
    } finally {
      setSubmitting(false);
    }
  };

  const categoryInfo = CATEGORIES.find((c) => c.key === form.category);
  const appTypeInfo = APP_TYPES.find((t) => t.key === form.appType);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
      {/* 左侧：步骤指示器 */}
      <aside>
        <div className="rounded-2xl border border-gray-200 bg-white p-4 lg:sticky lg:top-4">
          <ol className="space-y-1">
            {STEPS.map((s, idx) => {
              const isActive = s.key === step;
              const isDone = idx < stepIndex;
              const valid = stepValid[s.key];
              return (
                <li key={s.key}>
                  <button
                    type="button"
                    onClick={() => setStep(s.key)}
                    className={`flex w-full items-start gap-3 rounded-lg p-2.5 text-left transition-colors ${
                      isActive ? "bg-indigo-50" : "hover:bg-gray-50"
                    }`}
                  >
                    <div
                      className={`mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                        isActive
                          ? "bg-indigo-600 text-white"
                          : isDone
                            ? "bg-green-100 text-green-700"
                            : valid
                              ? "bg-gray-100 text-gray-500"
                              : "bg-gray-100 text-gray-400"
                      }`}
                    >
                      {isDone ? "✓" : idx + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div
                        className={`text-sm font-medium ${
                          isActive ? "text-indigo-700" : isDone ? "text-green-700" : "text-gray-700"
                        }`}
                      >
                        {s.label}
                      </div>
                      <div className="mt-0.5 text-xs text-gray-400 truncate">{s.desc}</div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ol>

          {draftRestored && (
            <div className="mt-4 rounded-lg bg-amber-50 p-2.5 text-xs text-amber-700">
              <div className="flex items-center gap-1.5">
                <span>📝</span>
                <span>已恢复上次草稿</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  clearDraft();
                  setForm(emptyForm());
                  setTagsInput("");
                  setStep("basic");
                  setDraftRestored(false);
                }}
                className="mt-1.5 text-amber-800 underline hover:text-amber-900"
              >
                清空重写
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* 右侧：表单 */}
      <div>
        {draftRestored && (
          <div className="mb-4 rounded-xl bg-amber-50 px-4 py-2 text-xs text-amber-700 lg:hidden">
            📝 已恢复上次草稿
          </div>
        )}

        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          {error && (
            <div className="mb-4 rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-600">{error}</div>
          )}
          {successMsg && (
            <div className="mb-4 rounded-lg bg-green-50 px-4 py-2.5 text-sm text-green-600">
              {successMsg}
            </div>
          )}

          {/* 步骤 1：基础信息 */}
          {step === "basic" && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-bold">基础信息</h2>
                <p className="mt-1 text-sm text-gray-500">
                  把你应用的核心信息告诉用户，让他们一眼知道你能解决什么问题
                </p>
              </div>

              {/* AI 一句话生成 */}
              <div className="rounded-xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-purple-50 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-base">✨</span>
                  <span className="text-sm font-semibold text-indigo-700">AI 一句话生成</span>
                  <span className="text-xs text-gray-400">（节省 80% 填写时间）</span>
                </div>
                <p className="mb-2 text-xs text-gray-600">
                  用一句话描述你的应用（比如：&quot;帮法律人审合同的 AI&quot;），AI 自动生成名称、描述、标签、推荐分类
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="例：帮小红书博主写爆款标题的 AI"
                    className="flex-1 rounded-lg border border-indigo-200 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAiGenerate();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAiGenerate}
                    disabled={aiGenerating}
                    className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {aiGenerating ? "生成中..." : "AI 生成"}
                  </button>
                </div>
              </div>

              {/* 名称 */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  应用名称 <span className="text-red-500">*</span>
                  <span className="ml-1 text-xs text-gray-400">
                    {form.title.length}/50
                  </span>
                </label>
                <input
                  type="text"
                  maxLength={50}
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="给你的 AI 应用起个名字"
                  className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                />
              </div>

              {/* 描述 */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  应用描述 <span className="text-red-500">*</span>
                  <span className="ml-1 text-xs text-gray-400">≥ 10 字</span>
                </label>
                <textarea
                  rows={5}
                  maxLength={1000}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="详细描述你的应用功能、特点、适用场景。建议结构：解决什么问题 + 怎么解决 + 用户能得到什么"
                  className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                />
                <p className="mt-1 text-xs text-gray-400">{form.description.length}/1000</p>
              </div>

              {/* 分类 & 类型 */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
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
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
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

              {appTypeInfo && (
                <div className="rounded-lg bg-gray-50 px-4 py-2.5 text-xs text-gray-500">
                  💡 {appTypeInfo.desc}
                </div>
              )}

              {/* 标签 */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  标签
                  <span className="ml-1 text-xs text-gray-400">
                    （最多 10 个，用逗号分隔）
                  </span>
                </label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="例：GPT, 写作, 自动化, 效率"
                  className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                />
                {parsedTags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {parsedTags.map((t, i) => (
                      <span
                        key={i}
                        className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs text-indigo-700"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 步骤 2：媒体资源 */}
          {step === "media" && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-bold">媒体资源</h2>
                <p className="mt-1 text-sm text-gray-500">
                  好的封面和截图能让应用点击率提升 3 倍。{!form.coverImage && "建议至少上传 1 张封面。"}
                </p>
              </div>

              {/* 封面 */}
              <ImageUploader
                label="封面图（必填）"
                hint="建议 800×800 或 16:9，应用商店和详情页都将使用这张图"
                value={form.coverImage ? [form.coverImage] : []}
                onChange={(imgs) => setForm({ ...form, coverImage: imgs[0] || null })}
                bucket={BUCKETS.COVERS}
                maxCount={1}
                maxSizeMB={5}
              />

              {/* 截图 */}
              <ImageUploader
                label="应用截图"
                hint="展示你的应用界面、功能亮点，可拖拽排序（最多 6 张）"
                value={form.screenshots}
                onChange={(imgs) => setForm({ ...form, screenshots: imgs })}
                bucket={BUCKETS.SCREENSHOTS}
                maxCount={6}
                maxSizeMB={8}
                sortable
              />
            </div>
          )}

          {/* 步骤 3：定价权益 */}
          {step === "pricing" && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-bold">定价与访问</h2>
                <p className="mt-1 text-sm text-gray-500">
                  选择合适的定价档位，平台默认抽取 10% 作为服务费
                </p>
              </div>

              {/* 定价档位 */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  定价 <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                  {PRICE_SUGGESTIONS.map((p) => (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => setForm({ ...form, price: p.value })}
                      className={`rounded-xl border-2 p-3 text-left transition-colors ${
                        form.price === p.value
                          ? "border-indigo-500 bg-indigo-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="text-sm font-semibold text-gray-900">{p.label}</div>
                      <div className="mt-0.5 text-xs text-gray-500">{p.desc}</div>
                    </button>
                  ))}
                </div>
                <div className="mt-3 flex items-center gap-3">
                  <span className="text-amber-500 text-lg">⚡</span>
                  <input
                    type="number"
                    min={0}
                    max={100000}
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: parseInt(e.target.value) || 0 })}
                    className="w-32 rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                  />
                  <span className="text-sm text-gray-500">积分</span>
                </div>
              </div>

              {/* 收入预估 */}
              <div className="rounded-xl bg-amber-50 p-4">
                <div className="text-sm font-medium text-amber-900">💰 收入预估</div>
                <div className="mt-1 text-xs text-amber-800">
                  每次售出你将获得{" "}
                  <span className="font-semibold">{formatPoints(Math.floor(form.price * 0.9))}</span> 积分
                  （{formatPoints(Math.floor(form.price * 0.1))} 归平台）
                </div>
              </div>

              {/* 访问地址 */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  访问地址
                  <span className="ml-1 text-xs text-gray-400">（购买后用户可访问）</span>
                </label>
                <input
                  type="url"
                  value={form.accessUrl}
                  onChange={(e) => setForm({ ...form, accessUrl: e.target.value })}
                  placeholder="https://your-app.com（免费应用可填，付费应用必填）"
                  className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                />
              </div>

              {/* 使用说明 */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  使用说明
                  <span className="ml-1 text-xs text-gray-400">（购买后可见）</span>
                </label>
                <textarea
                  rows={5}
                  value={form.usageInstructions}
                  onChange={(e) => setForm({ ...form, usageInstructions: e.target.value })}
                  placeholder="详细的使用步骤、注意事项、API 调用方法、关键提示等"
                  className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                />
              </div>
            </div>
          )}

          {/* 步骤 4：预览发布 */}
          {step === "preview" && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-bold">预览发布</h2>
                <p className="mt-1 text-sm text-gray-500">
                  确认应用信息无误，提交后将进入管理员审核队列
                </p>
              </div>

              {/* 用户视角预览 */}
              <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="mb-2 text-xs text-gray-400">👀 用户视角预览</div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-[120px_1fr]">
                  {/* 封面 */}
                  <div className="aspect-square overflow-hidden rounded-xl bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100">
                    {form.coverImage ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={form.coverImage.url}
                        alt="封面"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-4xl">
                        {categoryInfo?.icon || "📦"}
                      </div>
                    )}
                  </div>
                  {/* 信息 */}
                  <div>
                    <div className="mb-2 flex flex-wrap items-center gap-1.5">
                      <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-600">
                        {appTypeInfo?.label || form.appType}
                      </span>
                      <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                        {categoryInfo?.icon} {categoryInfo?.label || form.category}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold">
                      {form.title || <span className="text-gray-300">未填写</span>}
                    </h3>
                    <p className="mt-1 line-clamp-2 text-sm text-gray-500">
                      {form.description || <span className="text-gray-300">未填写</span>}
                    </p>
                    {parsedTags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {parsedTags.slice(0, 5).map((t, i) => (
                          <span
                            key={i}
                            className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-500"
                          >
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-1">
                      <span className="text-base">⚡</span>
                      <span className="font-bold text-amber-700">
                        {form.price === 0 ? "免费" : formatPoints(form.price)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 截图预览 */}
                {form.screenshots.length > 0 && (
                  <div className="mt-4 border-t border-gray-100 pt-4">
                    <div className="mb-2 text-xs text-gray-500">应用截图</div>
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                      {form.screenshots.map((s) => (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          key={s.path}
                          src={s.url}
                          alt="截图"
                          className="aspect-square rounded-lg object-cover"
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 信息汇总 */}
              <div className="rounded-xl bg-gray-50 p-4 text-sm">
                <div className="mb-2 font-medium text-gray-700">📋 信息汇总</div>
                <dl className="space-y-1 text-gray-600">
                  <div className="flex gap-2">
                    <dt className="w-20 flex-shrink-0 text-gray-400">分类</dt>
                    <dd>{categoryInfo?.icon} {categoryInfo?.label}</dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="w-20 flex-shrink-0 text-gray-400">类型</dt>
                    <dd>{appTypeInfo?.label}</dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="w-20 flex-shrink-0 text-gray-400">价格</dt>
                    <dd>
                      {form.price === 0 ? "免费" : `${formatPoints(form.price)} 积分`}
                      {form.price > 0 && (
                        <span className="ml-2 text-xs text-gray-400">
                          （你得 {formatPoints(Math.floor(form.price * 0.9))}）
                        </span>
                      )}
                    </dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="w-20 flex-shrink-0 text-gray-400">访问地址</dt>
                    <dd className="truncate">{form.accessUrl || "未填写"}</dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="w-20 flex-shrink-0 text-gray-400">封面</dt>
                    <dd>{form.coverImage ? "✓ 已上传" : "✗ 未上传"}</dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="w-20 flex-shrink-0 text-gray-400">截图</dt>
                    <dd>{form.screenshots.length} 张</dd>
                  </div>
                </dl>
              </div>

              <div className="rounded-lg bg-blue-50 p-3 text-xs text-blue-700">
                ℹ️ 提交后需等待管理员审核，审核通过后将在应用市场展示。预计 1-3 个工作日。
              </div>
            </div>
          )}

          {/* 底部按钮 */}
          <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-5">
            <button
              type="button"
              onClick={goPrev}
              disabled={stepIndex === 0}
              className="rounded-xl border border-gray-300 px-5 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-30"
            >
              ← 上一步
            </button>

            {step !== "preview" ? (
              <button
                type="button"
                onClick={goNext}
                disabled={!stepValid[step]}
                className="rounded-xl bg-indigo-600 px-6 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                下一步 →
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting || !allValid}
                className="rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-2.5 text-sm font-semibold text-white hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50"
              >
                {submitting ? "提交中..." : "🚀 提交审核"}
              </button>
            )}
          </div>
        </div>

        <div className="mt-4 text-center">
          <Link href="/dashboard/apps" className="text-sm text-gray-400 hover:text-gray-600">
            取消并返回
          </Link>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ImageUploader, UploadedImage } from "@/components/image-uploader";
import { BUCKETS } from "@/lib/storage";
import { CATEGORIES, APP_TYPES, formatPoints } from "@/lib/constants";

interface PublishFormProps {
  categories: { key: string; label: string; icon: string }[];
  appTypes: { key: string; label: string; desc: string }[];
  initialData?: {
    id: string;
    title: string;
    description: string;
    category: string;
    appType: string;
    price: number;
    accessUrl: string;
    usageInstructions: string;
    coverImage: string | null;
    screenshots: string[];
    tags: string[];
  };
  mode?: "create" | "edit";
}

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

const DRAFT_KEY = "aihub:publish-draft:v3";
const DRAFT_KEY_EDIT = "aihub:edit-draft:v1";

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

function formFromInitialData(d: NonNullable<PublishFormProps["initialData"]>): FormState {
  return {
    title: d.title,
    description: d.description,
    category: d.category || CATEGORIES[0].key,
    appType: d.appType || APP_TYPES[0].key,
    tags: d.tags,
    coverImage: d.coverImage
      ? { url: d.coverImage, path: d.coverImage, isExisting: true }
      : null,
    screenshots: d.screenshots.map((url) => ({
      url,
      path: url,
      isExisting: true,
    })),
    price: d.price,
    accessUrl: d.accessUrl,
    usageInstructions: d.usageInstructions,
  };
}

// 用 useCallback 引用稳定的 Field 组件，避免父组件重渲染时 remount 子 input 导致失焦
function Field({
  label,
  required,
  children,
  hint,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-gray-800">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-gray-400">{hint}</p>}
    </div>
  );
}

export function PublishForm({
  categories,
  appTypes,
  initialData,
  mode = "create",
}: PublishFormProps) {
  const router = useRouter();
  const isEdit = mode === "edit" && !!initialData;
  const draftKey = isEdit ? `${DRAFT_KEY_EDIT}:${initialData!.id}` : DRAFT_KEY;
  const [submitting, setSubmitting] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [draftRestored, setDraftRestored] = useState(false);
  const [tagsInput, setTagsInput] = useState(
    isEdit ? initialData!.tags.join(", ") : ""
  );
  const [aiPrompt, setAiPrompt] = useState("");
  const [form, setForm] = useState<FormState>(() =>
    isEdit ? formFromInitialData(initialData!) : emptyForm()
  );

  // 加载草稿（编辑模式用不同的 key）
  useEffect(() => {
    try {
      const raw = localStorage.getItem(draftKey);
      if (raw) {
        const draft = JSON.parse(raw);
        setForm({ ...emptyForm(), ...draft.form });
        setTagsInput(draft.tagsInput || "");
        setDraftRestored(true);
      }
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 自动保存草稿
  useEffect(() => {
    // 草稿恢复成功后才允许写本地，避免覆盖已有草稿
    if (!draftRestored) return;
    const id = setTimeout(() => {
      try {
        localStorage.setItem(
          draftKey,
          JSON.stringify({ form, tagsInput, ts: Date.now() })
        );
      } catch {
        // ignore quota
      }
    }, 800);
    return () => clearTimeout(id);
  }, [form, tagsInput, draftRestored, draftKey]);

  const clearDraft = () => {
    try {
      localStorage.removeItem(draftKey);
    } catch {
      // ignore
    }
  };

  // 解析标签
  const parsedTags = useMemo(
    () =>
      tagsInput
        .split(/[,，\s]+/)
        .map((t) => t.trim())
        .filter(Boolean)
        .slice(0, 10),
    [tagsInput]
  );

  // 校验
  const allValid = useMemo(() => {
    return (
      form.title.trim().length > 0 &&
      form.description.trim().length >= 10 &&
      form.price >= 0
    );
  }, [form]);

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

  // 提交
  const handleSubmit = async () => {
    if (!allValid) {
      setError("请完成必填项：应用名称、应用描述");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const payload = {
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
      };

      if (isEdit) {
        // 编辑走 PATCH
        const res = await fetch(`/api/apps/${initialData!.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "update", data: payload }),
        });
        const data = await res.json();
        if (res.ok) {
          clearDraft();
          setSuccessMsg("更新成功，等待重新审核！跳转中...");
          setTimeout(() => router.push("/dashboard/apps"), 800);
        } else {
          setError(data.error || "更新失败");
        }
      } else {
        // 创建走 POST
        const res = await fetch("/api/apps", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (res.ok) {
          clearDraft();
          setSuccessMsg("发布成功！跳转中...");
          setTimeout(() => router.push("/dashboard/apps"), 800);
        } else {
          setError(data.error || "发布失败");
        }
      }
    } catch {
      setError("网络错误");
    } finally {
      setSubmitting(false);
    }
  };

  const categoryInfo = CATEGORIES.find((c) => c.key === form.category);
  const appTypeInfo = APP_TYPES.find((t) => t.key === form.appType);

  // 用 useCallback 包裹单个字段的 setState，避免每次 render 产生新函数引用
  const setField = useCallback(
    <K extends keyof FormState>(key: K, value: FormState[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  return (
    <div className="space-y-6">
      {/* 顶部提示 */}
      {(error || successMsg || draftRestored) && (
        <div className="space-y-2">
          {error && (
            <div className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-600">
              {error}
            </div>
          )}
          {successMsg && (
            <div className="rounded-lg bg-green-50 px-4 py-2.5 text-sm text-green-600">
              {successMsg}
            </div>
          )}
          {draftRestored && (
            <div className="rounded-lg bg-amber-50 px-4 py-2.5 text-sm text-amber-700 flex items-center justify-between">
              <span>📝 已恢复上次草稿</span>
              <button
                type="button"
                onClick={() => {
                  clearDraft();
                  setForm(emptyForm());
                  setTagsInput("");
                  setDraftRestored(false);
                }}
                className="text-amber-800 underline hover:text-amber-900"
              >
                清空重写
              </button>
            </div>
          )}
        </div>
      )}

      <div className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8 shadow-sm">
        <div className="space-y-6">
          {/* 应用名称 */}
          <Field label="应用名称" required>
            <input
              type="text"
              maxLength={50}
              value={form.title}
              onChange={(e) => setField("title", e.target.value)}
              placeholder="给你的 AI 应用起个名字"
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
            <p className="text-xs text-gray-400 text-right">
              {form.title.length}/50
            </p>
          </Field>

          {/* 应用描述 */}
          <Field label="应用描述" required>
            <textarea
              rows={5}
              maxLength={1000}
              value={form.description}
              onChange={(e) => setField("description", e.target.value)}
              placeholder="详细描述你的应用功能、特点、适用场景。建议结构：解决什么问题 + 怎么解决 + 用户能得到什么"
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
            <p className="text-xs text-gray-400">
              {form.description.length}/1000，至少 10 字
            </p>
          </Field>

          {/* AI 生成 */}
          <div className="rounded-xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-purple-50 p-4">
            <div className="mb-2 flex items-center gap-2">
              <span className="text-base">✨</span>
              <span className="text-sm font-semibold text-indigo-700">
                AI 一句话生成
              </span>
              <span className="text-xs text-gray-400">（节省 80% 填写时间）</span>
            </div>
            <p className="mb-3 text-xs text-gray-600">
              用一句话描述你的应用，AI 自动生成名称、描述、标签和推荐分类
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

          {/* 分类 & 类型 */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Field label="分类" required>
              <select
                value={form.category}
                onChange={(e) => setField("category", e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              >
                {categories.map((cat) => (
                  <option key={cat.key} value={cat.key}>
                    {cat.icon} {cat.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="应用类型" required>
              <select
                value={form.appType}
                onChange={(e) => setField("appType", e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              >
                {appTypes.map((type) => (
                  <option key={type.key} value={type.key}>
                    {type.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          {appTypeInfo && (
            <div className="rounded-lg bg-gray-50 px-4 py-2.5 text-xs text-gray-500">
              💡 {appTypeInfo.desc}
            </div>
          )}

          {/* 封面图 */}
          <Field label="封面图" required hint="建议 800×800 或 16:9，应用商店和详情页都将使用这张图">
            <ImageUploader
              label=""
              value={form.coverImage ? [form.coverImage] : []}
              onChange={(imgs) => setField("coverImage", imgs[0] || null)}
              bucket={BUCKETS.COVERS}
              maxCount={1}
              maxSizeMB={5}
            />
          </Field>

          {/* 应用截图 */}
          <Field label="应用截图" hint="展示你的应用界面、功能亮点，可拖拽排序（最多 6 张）">
            <ImageUploader
              label=""
              value={form.screenshots}
              onChange={(imgs) => setField("screenshots", imgs)}
              bucket={BUCKETS.SCREENSHOTS}
              maxCount={6}
              maxSizeMB={8}
              sortable
            />
          </Field>

          {/* 定价 */}
          <Field label="定价（积分）" required hint="填 0 表示免费。平台默认抽取 10% 作为服务费。">
            <div className="flex items-center gap-3">
              <span className="text-amber-500 text-lg">⚡</span>
              <input
                type="number"
                min={0}
                max={100000}
                value={form.price}
                onChange={(e) => setField("price", parseInt(e.target.value) || 0)}
                className="w-32 rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              />
              <span className="text-sm text-gray-500">
                {form.price === 0 ? "免费应用" : `${formatPoints(form.price)} 积分`}
              </span>
            </div>
            {form.price > 0 && (
              <p className="text-xs text-gray-400">
                每次售出你将获得{" "}
                <span className="font-semibold text-gray-600">
                  {formatPoints(Math.floor(form.price * 0.9))}
                </span>{" "}
                积分（平台抽成 {formatPoints(Math.floor(form.price * 0.1))} 积分）
              </p>
            )}
          </Field>

          {/* 标签 */}
          <Field label="标签">
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="用逗号分隔，如：GPT, 写作, 自动化（最多10个）"
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
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
          </Field>

          {/* 访问地址 */}
          <Field label="访问地址" hint="购买后用户可访问，免费应用也可填写">
            <input
              type="url"
              value={form.accessUrl}
              onChange={(e) => setField("accessUrl", e.target.value)}
              placeholder="https://your-app.com"
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
          </Field>

          {/* 使用说明 */}
          <Field label="使用说明" hint="详细的使用步骤、注意事项等（购买后可见）">
            <textarea
              rows={5}
              value={form.usageInstructions}
              onChange={(e) => setField("usageInstructions", e.target.value)}
              placeholder="详细的使用步骤、注意事项、API 调用方法、关键提示等"
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
          </Field>
        </div>

        {/* 底部按钮 */}
        <div className="mt-10 flex flex-wrap items-center gap-3 border-t border-gray-100 pt-6">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="rounded-xl bg-indigo-600 px-8 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {submitting ? "提交中..." : isEdit ? "保存修改" : "提交审核"}
          </button>
          <Link
            href="/dashboard/apps"
            className="rounded-xl border border-gray-300 px-8 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            取消
          </Link>
        </div>

        <p className="mt-3 text-xs text-gray-400">
          {isEdit
            ? "保存后应用状态会重置为「待审核」，需要重新审核才能上架。"
            : "提交后需等待管理员审核，审核通过后将在应用市场展示。"}
        </p>
      </div>
    </div>
  );
}

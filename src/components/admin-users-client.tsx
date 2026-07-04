"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatPoints, formatDate, timeAgo } from "@/lib/constants";

interface UserListItem {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: string;
  points: number;
  profession: string | null;
  interests: string | null;
  workYears: number | null;
  appDomains: string | null;
  bio: string | null;
  avatar: string | null;
  isDeveloper: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
  _count: { apps: number; purchases: number };
}

interface AdminUsersClientProps {
  users: UserListItem[];
}

const ROLE_LABELS: Record<string, { label: string; cls: string }> = {
  ADMIN: { label: "管理员", cls: "bg-purple-50 text-purple-600" },
  DEVELOPER: { label: "开发者", cls: "bg-indigo-50 text-indigo-600" },
  USER: { label: "普通用户", cls: "bg-gray-50 text-gray-500" },
};

const ROLE_OPTIONS = [
  { key: "USER", label: "普通用户" },
  { key: "DEVELOPER", label: "开发者" },
  { key: "ADMIN", label: "管理员" },
];

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

const WORK_YEAR_OPTIONS = [
  { label: "在校/实习", value: 0 },
  { label: "1年以下", value: 1 },
  { label: "1-3年", value: 3 },
  { label: "3-5年", value: 5 },
  { label: "5-10年", value: 10 },
  { label: "10年以上", value: 15 },
];

function parseJsonArray(value: string | null): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return value.split(",").map((s) => s.trim()).filter(Boolean);
  }
}

export function AdminUsersClient({ users }: AdminUsersClientProps) {
  const router = useRouter();
  const [userList, setUserList] = useState(users);
  const [editing, setEditing] = useState<UserListItem | null>(null);
  const [detail, setDetail] = useState<{ type: "points" | "apps" | "purchases"; userId: string } | null>(null);
  const [detailData, setDetailData] = useState<unknown>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    role: "USER",
    points: 0,
    profession: "",
    interests: [] as string[],
    workYears: 0,
    appDomains: [] as string[],
    bio: "",
    isDeveloper: false,
    password: "",
  });

  const openEdit = (user: UserListItem) => {
    setEditing(user);
    setMessage(null);
    setForm({
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      points: user.points,
      profession: user.profession || "",
      interests: parseJsonArray(user.interests),
      workYears: user.workYears ?? 0,
      appDomains: parseJsonArray(user.appDomains),
      bio: user.bio || "",
      isDeveloper: user.isDeveloper,
      password: "",
    });
  };

  const closeEdit = () => {
    setEditing(null);
    setMessage(null);
  };

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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/users/${editing.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          workYears: form.workYears || null,
          bio: form.bio || null,
          profession: form.profession || null,
          interests: form.interests,
          appDomains: form.isDeveloper ? form.appDomains : [],
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setUserList((prev) =>
          prev.map((u) => (u.id === editing.id ? { ...u, ...data.user } : u))
        );
        setMessage({ type: "ok", text: "保存成功" });
      } else {
        setMessage({ type: "err", text: data.error || "保存失败" });
      }
    } catch {
      setMessage({ type: "err", text: "网络错误，请重试" });
    } finally {
      setSaving(false);
    }
  };

  const openDetail = async (type: "points" | "apps" | "purchases", userId: string) => {
    setDetail({ type, userId });
    setDetailData(null);
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}/${type}`);
      const data = await res.json();
      setDetailData(data);
    } catch {
      setDetailData({ error: "加载失败" });
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    setDetail(null);
    setDetailData(null);
  };

  const selectedUser = editing || (detail ? userList.find((u) => u.id === detail.userId) : null);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">用户管理</h1>
      <p className="text-sm text-gray-500 mb-4">共 {userList.length} 位用户</p>

      <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50/50">
                    {[
                      "用户信息",
                      "角色",
                      "手机号",
                      "职业",
                      "积分",
                      "发布应用",
                      "购买次数",
                      "注册时间",
                      "最近登录",
                      "操作",
                    ].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {userList.map((user) => {
                    const role = ROLE_LABELS[user.role] || { label: user.role, cls: "bg-gray-50 text-gray-500" };
                    return (
                      <tr key={user.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="flex-shrink-0 flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 text-white text-sm font-semibold">
                              {user.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-gray-800">{user.name}</div>
                              <div className="text-xs text-gray-400">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${role.cls}`}>
                            {role.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                          {user.phone || <span className="text-gray-300">—</span>}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                          {user.profession || <span className="text-gray-300">—</span>}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <button
                            onClick={() => openDetail("points", user.id)}
                            className="text-sm font-semibold text-amber-600 hover:text-amber-700 hover:underline"
                          >
                            ⚡{formatPoints(user.points)}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-sm text-center text-gray-600 whitespace-nowrap">
                          <button
                            onClick={() => openDetail("apps", user.id)}
                            className="hover:text-indigo-600 hover:underline"
                          >
                            {user._count.apps}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-sm text-center text-gray-600 whitespace-nowrap">
                          <button
                            onClick={() => openDetail("purchases", user.id)}
                            className="hover:text-indigo-600 hover:underline"
                          >
                            {user._count.purchases}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-400 whitespace-nowrap">
                          {formatDate(user.createdAt)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-400 whitespace-nowrap">
                          {user.lastLoginAt ? (
                            <span className="text-indigo-600">{timeAgo(user.lastLoginAt)}</span>
                          ) : (
                            <span className="text-gray-300">从未登录</span>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <button
                            onClick={() => openEdit(user)}
                            className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700"
                          >
                            编辑
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900">编辑用户：{editing.name}</h2>
              <button
                onClick={closeEdit}
                className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">姓名 *</label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                    className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">邮箱 *</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                    className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">手机号</label>
                  <input
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">角色</label>
                  <select
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value, isDeveloper: e.target.value === "DEVELOPER" })}
                    className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 bg-white"
                  >
                    {ROLE_OPTIONS.map((r) => (
                      <option key={r.key} value={r.key}>{r.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">积分</label>
                  <input
                    type="number"
                    min={0}
                    value={form.points}
                    onChange={(e) => setForm({ ...form, points: Number(e.target.value) })}
                    className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">重置密码</label>
                  <input
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="不填则保留原密码"
                    className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">职业</label>
                  <select
                    value={form.profession}
                    onChange={(e) => setForm({ ...form, profession: e.target.value })}
                    className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 bg-white"
                  >
                    <option value="">请选择</option>
                    {PROFESSIONS.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">工作年限</label>
                  <select
                    value={form.workYears}
                    onChange={(e) => setForm({ ...form, workYears: Number(e.target.value) })}
                    className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 bg-white"
                  >
                    {WORK_YEAR_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">个人简介</label>
                <textarea
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  rows={3}
                  maxLength={500}
                  className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">感兴趣的 AI 领域</label>
                <div className="flex flex-wrap gap-2">
                  {INTEREST_OPTIONS.map((item) => {
                    const selected = form.interests.includes(item);
                    return (
                      <button
                        type="button"
                        key={item}
                        onClick={() => toggleInterest(item)}
                        className={`rounded-full px-3 py-1 text-xs font-medium border transition-all ${
                          selected
                            ? "border-indigo-600 bg-indigo-50 text-indigo-600"
                            : "border-gray-200 text-gray-500 hover:border-gray-300"
                        }`}
                      >
                        {item}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 p-4 bg-gray-50">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isDeveloper}
                    onChange={(e) => setForm({ ...form, isDeveloper: e.target.checked, role: e.target.checked ? "DEVELOPER" : "USER" })}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm font-medium text-gray-700">AI 开发者</span>
                </label>

                {form.isDeveloper && (
                  <div className="mt-3">
                    <label className="block text-sm font-medium text-gray-700 mb-2">擅长的 AI 应用领域</label>
                    <div className="flex flex-wrap gap-2">
                      {APP_DOMAIN_OPTIONS.map((item) => {
                        const selected = form.appDomains.includes(item);
                        return (
                          <button
                            type="button"
                            key={item}
                            onClick={() => toggleAppDomain(item)}
                            className={`rounded-full px-3 py-1 text-xs font-medium border transition-all ${
                              selected
                                ? "border-purple-600 bg-purple-50 text-purple-600"
                                : "border-gray-200 text-gray-500 hover:border-gray-300"
                            }`}
                          >
                            {item}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {message && (
                <div className={`rounded-lg px-4 py-2.5 text-sm ${
                  message.type === "ok" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"
                }`}>
                  {message.text}
                </div>
              )}

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeEdit}
                  className="rounded-xl border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  {saving ? "保存中..." : "保存修改"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="w-full max-w-3xl max-h-[85vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">
                {selectedUser?.name} 的
                {detail.type === "points" ? "积分记录" : detail.type === "apps" ? "发布应用" : "购买记录"}
              </h2>
              <button
                onClick={closeDetail}
                className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            {detailLoading ? (
              <p className="text-sm text-gray-400 py-8 text-center">加载中...</p>
            ) : detailData && typeof detailData === "object" && "error" in detailData ? (
              <p className="text-sm text-red-600 py-8 text-center">{(detailData as { error: string }).error}</p>
            ) : detail.type === "points" ? (
              <PointsDetail data={detailData} />
            ) : detail.type === "apps" ? (
              <AppsDetail data={detailData} />
            ) : (
              <PurchasesDetail data={detailData} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function PointsDetail({ data }: { data: unknown }) {
  const transactions = (data as { transactions?: Array<Record<string, unknown>> } | undefined)?.transactions || [];
  const labels: Record<string, string> = {
    RECHARGE: "充值",
    SPEND: "消费",
    REWARD: "奖励",
    REFUND: "退款",
  };
  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-2 text-left text-gray-500 font-medium">时间</th>
            <th className="px-4 py-2 text-left text-gray-500 font-medium">类型</th>
            <th className="px-4 py-2 text-right text-gray-500 font-medium">变动</th>
            <th className="px-4 py-2 text-right text-gray-500 font-medium">余额</th>
            <th className="px-4 py-2 text-left text-gray-500 font-medium">说明</th>
          </tr>
        </thead>
        <tbody>
          {transactions.length === 0 ? (
            <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">暂无记录</td></tr>
          ) : (
            transactions.map((t, i) => (
              <tr key={i} className="border-t border-gray-100">
                <td className="px-4 py-2 text-gray-600 whitespace-nowrap">{formatDate(String(t.createdAt))}</td>
                <td className="px-4 py-2 text-gray-600">{labels[String(t.type)] || t.type}</td>
                <td className={`px-4 py-2 text-right font-medium ${Number(t.amount) >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {Number(t.amount) > 0 ? `+${t.amount}` : t.amount}
                </td>
                <td className="px-4 py-2 text-right text-gray-600">{formatPoints(Number(t.balanceAfter))}</td>
                <td className="px-4 py-2 text-gray-600 max-w-xs truncate">{String(t.description || "-")}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function AppsDetail({ data }: { data: unknown }) {
  const apps = (data as { apps?: Array<Record<string, unknown>> } | undefined)?.apps || [];
  const statusLabels: Record<string, { label: string; color: string }> = {
    PENDING: { label: "待审核", color: "bg-amber-50 text-amber-600" },
    APPROVED: { label: "已上架", color: "bg-green-50 text-green-600" },
    REJECTED: { label: "已拒绝", color: "bg-red-50 text-red-600" },
    SUSPENDED: { label: "已下架", color: "bg-gray-50 text-gray-600" },
  };
  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-2 text-left text-gray-500 font-medium">应用名称</th>
            <th className="px-4 py-2 text-left text-gray-500 font-medium">分类</th>
            <th className="px-4 py-2 text-left text-gray-500 font-medium">状态</th>
            <th className="px-4 py-2 text-right text-gray-500 font-medium">价格</th>
            <th className="px-4 py-2 text-right text-gray-500 font-medium">下载</th>
            <th className="px-4 py-2 text-left text-gray-500 font-medium">发布时间</th>
          </tr>
        </thead>
        <tbody>
          {apps.length === 0 ? (
            <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">暂无应用</td></tr>
          ) : (
            apps.map((app, i) => {
              const status = statusLabels[String(app.status)] || { label: String(app.status), color: "bg-gray-50 text-gray-600" };
              return (
                <tr key={i} className="border-t border-gray-100">
                  <td className="px-4 py-2 text-gray-800 font-medium">
                    <Link href={`/app/${app.id}`} className="hover:text-indigo-600 hover:underline">
                      {String(app.title)}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-gray-600">{String(app.category)}</td>
                  <td className="px-4 py-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${status.color}`}>{status.label}</span>
                  </td>
                  <td className="px-4 py-2 text-right text-gray-600">
                    {Number(app.price) === 0 ? "免费" : `⚡${formatPoints(Number(app.price))}`}
                  </td>
                  <td className="px-4 py-2 text-right text-gray-600">{Number(app.downloadCount)}</td>
                  <td className="px-4 py-2 text-gray-600 whitespace-nowrap">{formatDate(String(app.createdAt))}</td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

function PurchasesDetail({ data }: { data: unknown }) {
  const purchases = (data as { purchases?: Array<Record<string, unknown>> } | undefined)?.purchases || [];
  const typeLabels: Record<string, string> = { BUYOUT: "买断", SUBSCRIPTION: "订阅", PAY_PER_USE: "按次" };
  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-2 text-left text-gray-500 font-medium">应用</th>
            <th className="px-4 py-2 text-left text-gray-500 font-medium">类型</th>
            <th className="px-4 py-2 text-right text-gray-500 font-medium">积分</th>
            <th className="px-4 py-2 text-right text-gray-500 font-medium">剩余次数</th>
            <th className="px-4 py-2 text-left text-gray-500 font-medium">购买时间</th>
          </tr>
        </thead>
        <tbody>
          {purchases.length === 0 ? (
            <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">暂无购买</td></tr>
          ) : (
            purchases.map((p, i) => (
              <tr key={i} className="border-t border-gray-100">
                <td className="px-4 py-2 text-gray-800 font-medium">
                  {(p.app as { title?: string } | undefined)?.title || "未知应用"}
                </td>
                <td className="px-4 py-2 text-gray-600">{typeLabels[String(p.purchaseType)] || p.purchaseType}</td>
                <td className="px-4 py-2 text-right text-gray-600">⚡{formatPoints(Number(p.pointsCost))}</td>
                <td className="px-4 py-2 text-right text-gray-600">{Number(p.remainingUses)}</td>
                <td className="px-4 py-2 text-gray-600 whitespace-nowrap">{formatDate(String(p.createdAt))}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DashboardNav } from "@/components/dashboard-nav";
import { APP_STATUS, formatPoints, formatDate } from "@/lib/constants";

interface AppItem {
  id: string;
  title: string;
  description: string;
  status: string;
  price: number;
  downloadCount: number;
  createdAt: string | Date;
  coverImage?: string | null;
}

interface MyAppsClientProps {
  initialApps: AppItem[];
  role: string;
}

export function MyAppsClient({ initialApps, role }: MyAppsClientProps) {
  const router = useRouter();
  const [apps, setApps] = useState<AppItem[]>(initialApps);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "ok" | "err"; msg: string } | null>(null);

  // 删除弹窗状态
  const [deleteTarget, setDeleteTarget] = useState<AppItem | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const deleteInputRef = useRef<HTMLInputElement>(null);

  // 下架弹窗状态
  const [suspendTarget, setSuspendTarget] = useState<AppItem | null>(null);

  // 重新上架确认
  const [restoreTarget, setRestoreTarget] = useState<AppItem | null>(null);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 2400);
      return () => clearTimeout(t);
    }
  }, [toast]);

  useEffect(() => {
    if (deleteTarget) {
      setDeleteConfirmText("");
      setTimeout(() => deleteInputRef.current?.focus(), 50);
    }
  }, [deleteTarget]);

  const refresh = useCallback(() => {
    router.refresh();
  }, [router]);

  // 一键下架
  const handleSuspend = async (app: AppItem) => {
    setBusyId(app.id);
    try {
      const res = await fetch(`/api/apps/${app.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "suspend" }),
      });
      const data = await res.json();
      if (res.ok) {
        setApps((prev) =>
          prev.map((a) => (a.id === app.id ? { ...a, status: "SUSPENDED" } : a))
        );
        setToast({ type: "ok", msg: `「${app.title}」已下架` });
        setSuspendTarget(null);
        refresh();
      } else {
        setToast({ type: "err", msg: data.error || "下架失败" });
      }
    } catch {
      setToast({ type: "err", msg: "网络错误" });
    } finally {
      setBusyId(null);
    }
  };

  // 重新上架
  const handleRestore = async (app: AppItem) => {
    setBusyId(app.id);
    try {
      const res = await fetch(`/api/apps/${app.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "restore" }),
      });
      const data = await res.json();
      if (res.ok) {
        setApps((prev) =>
          prev.map((a) => (a.id === app.id ? { ...a, status: "PENDING" } : a))
        );
        setToast({ type: "ok", msg: `「${app.title}」已重新提交审核` });
        setRestoreTarget(null);
        refresh();
      } else {
        setToast({ type: "err", msg: data.error || "操作失败" });
      }
    } catch {
      setToast({ type: "err", msg: "网络错误" });
    } finally {
      setBusyId(null);
    }
  };

  // 一键删除
  const handleDelete = async (app: AppItem) => {
    if (deleteConfirmText !== app.title) {
      setToast({ type: "err", msg: "应用名称输入不一致，请重新确认" });
      return;
    }
    setBusyId(app.id);
    try {
      const res = await fetch(`/api/apps/${app.id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok) {
        setApps((prev) => prev.filter((a) => a.id !== app.id));
        setToast({ type: "ok", msg: `「${app.title}」已永久删除` });
        setDeleteTarget(null);
        refresh();
      } else {
        setToast({ type: "err", msg: data.error || "删除失败" });
      }
    } catch {
      setToast({ type: "err", msg: "网络错误" });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-8">
        <DashboardNav active="apps" role={role} />
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold">我的应用</h1>
              <p className="text-sm text-gray-500 mt-1">
                管理你发布的所有 AI 应用
              </p>
            </div>
            <Link
              href="/publish"
              className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              + 发布新应用
            </Link>
          </div>

          {apps.length === 0 ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center">
              <span className="text-4xl block mb-4">📦</span>
              <h3 className="text-lg font-semibold text-gray-700">
                还没有发布任何应用
              </h3>
              <p className="text-gray-400 mt-2 mb-6">
                把你的 AI 应用分享给更多用户
              </p>
              <Link
                href="/publish"
                className="inline-flex items-center rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                立即发布
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {apps.map((app) => {
                const status =
                  APP_STATUS[app.status as keyof typeof APP_STATUS];
                const isBusy = busyId === app.id;
                const isSuspended = app.status === "SUSPENDED";
                const isPending = app.status === "PENDING";
                const isApproved = app.status === "APPROVED";
                const isRejected = app.status === "REJECTED";

                return (
                  <div
                    key={app.id}
                    className="rounded-2xl border border-gray-200 bg-white p-5"
                  >
                    <div className="flex items-start gap-4">
                      {app.coverImage && (
                        <img
                          src={app.coverImage}
                          alt={app.title}
                          className="w-16 h-16 rounded-lg object-cover flex-shrink-0 bg-gray-100"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1 flex-wrap">
                          <Link
                            href={`/app/${app.id}`}
                            className="font-semibold text-gray-900 hover:text-indigo-600 truncate"
                          >
                            {app.title}
                          </Link>
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                              status?.color || "text-gray-600 bg-gray-50"
                            }`}
                          >
                            {status?.label || app.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 line-clamp-1">
                          {app.description}
                        </p>
                        <div className="mt-2 flex items-center gap-4 text-xs text-gray-400">
                          <span>⬇ {app.downloadCount}</span>
                          <span>
                            ⚡{" "}
                            {app.price === 0 ? "免费" : formatPoints(app.price)}
                          </span>
                          <span>{formatDate(app.createdAt)}</span>
                        </div>
                      </div>

                      {/* 操作按钮区 */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Link
                          href={`/dashboard/apps/${app.id}/edit`}
                          className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                          title="编辑"
                        >
                          ✏️ 编辑
                        </Link>

                        {isSuspended ? (
                          <button
                            type="button"
                            onClick={() => setRestoreTarget(app)}
                            disabled={isBusy}
                            className="rounded-lg border border-green-300 px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-50 disabled:opacity-50"
                          >
                            🔄 重新上架
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setSuspendTarget(app)}
                            disabled={isBusy || isPending}
                            className="rounded-lg border border-orange-300 px-3 py-1.5 text-xs font-medium text-orange-700 hover:bg-orange-50 disabled:opacity-50"
                            title={
                              isPending ? "待审核中的应用暂不能下架" : "一键下架"
                            }
                          >
                            ⏸ 一键下架
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => setDeleteTarget(app)}
                          disabled={isBusy}
                          className="rounded-lg border border-red-300 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                        >
                          🗑 一键删除
                        </button>
                      </div>
                    </div>

                    {(isPending || isRejected) && (
                      <div className="mt-3 rounded-lg bg-yellow-50 px-3 py-2 text-xs text-yellow-700">
                        {isPending
                          ? "⏳ 审核中：通过后会在应用市场上架"
                          : "❌ 审核未通过：可编辑后重新提交"}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 rounded-xl px-5 py-3 text-sm font-medium shadow-lg ${
            toast.type === "ok"
              ? "bg-green-600 text-white"
              : "bg-red-600 text-white"
          }`}
        >
          {toast.msg}
        </div>
      )}

      {/* 下架确认弹窗 */}
      {suspendTarget && (
        <Modal onClose={() => setSuspendTarget(null)}>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            确认下架「{suspendTarget.title}」？
          </h3>
          <p className="text-sm text-gray-600 mb-1">
            下架后该应用会从应用市场隐藏，用户无法再购买。
          </p>
          <p className="text-sm text-gray-600 mb-5">
            你可以随时重新提交审核，无需重新创建。
          </p>
          <ModalActions
            onCancel={() => setSuspendTarget(null)}
            onConfirm={() => handleSuspend(suspendTarget)}
            confirmText="确认下架"
            confirmStyle="orange"
            busy={busyId === suspendTarget.id}
          />
        </Modal>
      )}

      {/* 重新上架确认弹窗 */}
      {restoreTarget && (
        <Modal onClose={() => setRestoreTarget(null)}>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            重新上架「{restoreTarget.title}」？
          </h3>
          <p className="text-sm text-gray-600 mb-5">
            重新上架后状态会变为「待审核」，审核通过后再次展示在应用市场。
          </p>
          <ModalActions
            onCancel={() => setRestoreTarget(null)}
            onConfirm={() => handleRestore(restoreTarget)}
            confirmText="确认重新上架"
            confirmStyle="green"
            busy={busyId === restoreTarget.id}
          />
        </Modal>
      )}

      {/* 删除确认弹窗（强提示） */}
      {deleteTarget && (
        <Modal onClose={() => setDeleteTarget(null)}>
          <div className="flex items-start gap-3 mb-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <h3 className="text-lg font-semibold text-red-700">
                删除「{deleteTarget.title}」
              </h3>
              <p className="text-sm text-red-600 mt-1">
                此操作<strong>不可恢复</strong>，数据将被永久删除
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 mb-4">
            <p className="font-semibold mb-1">💡 建议先下架</p>
            <p>
              如果只是想暂时停止销售，可以先「一键下架」，保留应用数据，后续可重新上架。
            </p>
          </div>

          <ul className="text-sm text-gray-700 space-y-1 mb-4 list-disc pl-5">
            <li>应用的封面、截图、描述、标签全部丢失</li>
            <li>所有用户评价会被删除</li>
            <li>所有购买记录会被删除</li>
            <li>无法恢复，请谨慎操作</li>
          </ul>

          <div className="mb-5">
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              请输入应用名称{" "}
              <span className="text-red-500">「{deleteTarget.title}」</span>{" "}
              以确认删除：
            </label>
            <input
              ref={deleteInputRef}
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder={deleteTarget.title}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-200"
            />
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setDeleteTarget(null)}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              取消
            </button>
            <button
              type="button"
              onClick={() => handleDelete(deleteTarget)}
              disabled={
                busyId === deleteTarget.id ||
                deleteConfirmText !== deleteTarget.title
              }
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {busyId === deleteTarget.id ? "删除中..." : "确认删除"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Modal({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

function ModalActions({
  onCancel,
  onConfirm,
  confirmText,
  confirmStyle,
  busy,
}: {
  onCancel: () => void;
  onConfirm: () => void;
  confirmText: string;
  confirmStyle: "orange" | "green" | "red";
  busy: boolean;
}) {
  const colorMap = {
    orange: "bg-orange-600 hover:bg-orange-700",
    green: "bg-green-600 hover:bg-green-700",
    red: "bg-red-600 hover:bg-red-700",
  };
  return (
    <div className="flex items-center justify-end gap-2">
      <button
        type="button"
        onClick={onCancel}
        className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
      >
        取消
      </button>
      <button
        type="button"
        onClick={onConfirm}
        disabled={busy}
        className={`rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 ${colorMap[confirmStyle]}`}
      >
        {busy ? "处理中..." : confirmText}
      </button>
    </div>
  );
}

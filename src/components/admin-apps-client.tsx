"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { APP_STATUS, formatPoints, formatDate, CATEGORIES, APP_TYPES } from "@/lib/constants";
import Link from "next/link";

interface AdminAppData {
  id: string;
  title: string;
  description: string;
  category: string;
  appType: string;
  price: number;
  downloadCount: number;
  status: string;
  createdAt: string;
  developer: { name: string; email: string };
  tags: string[];
}

interface AdminAppsClientProps {
  apps: AdminAppData[];
  initialStatus: string;
}

export function AdminAppsClient({ apps, initialStatus }: AdminAppsClientProps) {
  const router = useRouter();
  const [processing, setProcessing] = useState<string | null>(null);

  const handleAction = async (appId: string, action: "approve" | "reject" | "suspend") => {
    setProcessing(appId);
    try {
      const res = await fetch(`/api/admin/apps/${appId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        router.refresh();
      }
    } finally {
      setProcessing(null);
    }
  };

  const statusTabs = [
    { key: "PENDING", label: "待审核" },
    { key: "APPROVED", label: "已上架" },
    { key: "REJECTED", label: "已拒绝" },
    { key: "SUSPENDED", label: "已下架" },
    { key: "ALL", label: "全部" },
  ];

  return (
    <div>
      {/* Status filter tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        {statusTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => router.push(`/admin/apps?status=${tab.key}`)}
            className={`whitespace-nowrap rounded-lg px-4 py-1.5 text-sm font-medium ${
              initialStatus === tab.key
                ? "bg-purple-600 text-white"
                : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Apps list */}
      {apps.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center">
          <span className="text-4xl block mb-4">📋</span>
          <p className="text-gray-400">没有找到应用</p>
        </div>
      ) : (
        <div className="space-y-3">
          {apps.map((app) => {
            const status = APP_STATUS[app.status as keyof typeof APP_STATUS];
            const category = CATEGORIES.find((c) => c.key === app.category);
            const appType = APP_TYPES.find((t) => t.key === app.appType);
            return (
              <div key={app.id} className="rounded-2xl border border-gray-200 bg-white p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <Link href={`/app/${app.id}`} className="font-semibold text-gray-900 hover:text-indigo-600 truncate">
                        {app.title}
                      </Link>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${status?.color || "text-gray-600 bg-gray-50"}`}>
                        {status?.label || app.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 line-clamp-2 mb-2">{app.description}</p>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400">
                      <span>{category?.icon} {category?.label}</span>
                      <span>{appType?.label}</span>
                      <span>⚡ {app.price === 0 ? "免费" : formatPoints(app.price)}</span>
                      <span>by {app.developer.name} ({app.developer.email})</span>
                      <span>{formatDate(app.createdAt)}</span>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex flex-col gap-2 shrink-0">
                    {app.status === "PENDING" && (
                      <>
                        <button
                          onClick={() => handleAction(app.id, "approve")}
                          disabled={processing === app.id}
                          className="rounded-lg bg-green-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
                        >
                          通过
                        </button>
                        <button
                          onClick={() => handleAction(app.id, "reject")}
                          disabled={processing === app.id}
                          className="rounded-lg bg-red-500 px-4 py-1.5 text-xs font-medium text-white hover:bg-red-600 disabled:opacity-50"
                        >
                          拒绝
                        </button>
                      </>
                    )}
                    {app.status === "APPROVED" && (
                      <button
                        onClick={() => handleAction(app.id, "suspend")}
                        disabled={processing === app.id}
                        className="rounded-lg bg-gray-500 px-4 py-1.5 text-xs font-medium text-white hover:bg-gray-600 disabled:opacity-50"
                      >
                        下架
                      </button>
                    )}
                    {app.status === "REJECTED" && (
                      <button
                        onClick={() => handleAction(app.id, "approve")}
                        disabled={processing === app.id}
                        className="rounded-lg bg-green-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
                      >
                        重新通过
                      </button>
                    )}
                    {app.status === "SUSPENDED" && (
                      <button
                        onClick={() => handleAction(app.id, "approve")}
                        disabled={processing === app.id}
                        className="rounded-lg bg-green-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
                      >
                        重新上架
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

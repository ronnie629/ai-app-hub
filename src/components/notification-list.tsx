"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Notification {
  id: string;
  type: string;
  title: string;
  content: string;
  link: string | null;
  read: boolean;
  createdAt: string;
}

const TYPE_STYLES: Record<string, { bg: string; text: string; icon: string }> = {
  system: { bg: "bg-blue-50", text: "text-blue-600", icon: "🔔" },
  app: { bg: "bg-indigo-50", text: "text-indigo-600", icon: "📦" },
  purchase: { bg: "bg-green-50", text: "text-green-600", icon: "💰" },
  review: { bg: "bg-purple-50", text: "text-purple-600", icon: "⭐" },
  warning: { bg: "bg-amber-50", text: "text-amber-600", icon: "⚠️" },
};

export function NotificationList({ initial }: { initial: Notification[] }) {
  const router = useRouter();
  const [list, setList] = useState(initial);

  const markAllRead = async () => {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    });
    setList((prev) => prev.map((n) => ({ ...n, read: true })));
    router.refresh();
  };

  const markRead = async (id: string) => {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setList((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const unreadCount = list.filter((n) => !n.read).length;

  if (list.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center">
        <div className="text-5xl mb-3">📭</div>
        <h3 className="text-lg font-semibold mb-2">暂无消息</h3>
        <p className="text-gray-500 text-sm">系统通知和活动消息会显示在这里</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
        <div className="text-sm text-gray-500">
          {unreadCount > 0 ? `${unreadCount} 条未读` : "全部已读"}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="text-sm text-indigo-600 hover:underline"
          >
            全部标记为已读
          </button>
        )}
      </div>

      <div className="divide-y divide-gray-100">
        {list.map((n) => {
          const style = TYPE_STYLES[n.type] || TYPE_STYLES.system;
          const content = (
            <div
              className={`flex items-start gap-4 px-5 py-4 hover:bg-gray-50 transition-colors ${
                !n.read ? "bg-indigo-50/30" : ""
              }`}
              onClick={() => !n.read && markRead(n.id)}
            >
              <div
                className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg ${style.bg} ${style.text}`}
              >
                {style.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-gray-900 text-sm">{n.title}</h4>
                  {!n.read && (
                    <span className="inline-block h-2 w-2 rounded-full bg-indigo-500" />
                  )}
                </div>
                {n.content && (
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">{n.content}</p>
                )}
                <p className="text-xs text-gray-400 mt-1.5">
                  {new Date(n.createdAt).toLocaleString("zh-CN")}
                </p>
              </div>
            </div>
          );
          return n.link ? (
            <Link
              key={n.id}
              href={n.link}
              className="block"
              onClick={() => !n.read && markRead(n.id)}
            >
              {content}
            </Link>
          ) : (
            <div key={n.id} className="cursor-pointer">
              {content}
            </div>
          );
        })}
      </div>
    </div>
  );
}

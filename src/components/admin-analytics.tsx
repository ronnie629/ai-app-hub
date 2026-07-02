"use client";

import { useState, useEffect } from "react";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { formatPoints, formatDate, timeAgo } from "@/lib/constants";

const COLORS = ["#6366f1", "#a855f7", "#ec4899", "#f59e0b", "#10b981", "#3b82f6", "#ef4444", "#8b5cf6"];

interface StatsData {
  stats: {
    totalUsers: number;
    totalApps: number;
    approvedApps: number;
    pendingApps: number;
    totalPurchases: number;
    platformRevenue: number;
    newUsersInPeriod: number;
  };
  chartData: Array<{ date: string; label: string; purchases: number; revenue: number }>;
  appsByCategory: Array<{ category: string; count: number }>;
  topApps: Array<{
    id: string; title: string; category: string;
    downloadCount: number; rating: number;
    _count: { purchases: number };
  }>;
  recentUsers: Array<{
    id: string; name: string; email: string; role: string;
    points: number; createdAt: string; lastLoginAt: string | null;
    isDeveloper: boolean;
  }>;
}

const PERIOD_OPTIONS = [
  { label: "近7天", value: "7d" },
  { label: "近30天", value: "30d" },
  { label: "全部", value: "all" },
];

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "管理员",
  DEVELOPER: "开发者",
  USER: "普通用户",
};

export function AdminAnalytics() {
  const [data, setData] = useState<StatsData | null>(null);
  const [period, setPeriod] = useState("7d");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/stats?period=${period}`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [period]);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">加载中...</div>
      </div>
    );
  }

  const stats = data.stats || {};
  const chartData = data.chartData || [];
  const appsByCategory = data.appsByCategory || [];
  const topApps = data.topApps || [];
  const recentUsers = data.recentUsers || [];

  return (
    <div className="space-y-8">
      {/* Period selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">数据看板</h2>
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setPeriod(opt.value)}
              className={`px-4 py-1.5 text-xs font-medium rounded-lg transition-all ${
                period === opt.value
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <p className="text-sm text-gray-400">总用户数</p>
          <p className="text-2xl font-bold mt-1">{stats.totalUsers}</p>
          <p className="text-xs text-indigo-500 mt-1">+{stats.newUsersInPeriod} 新增</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <p className="text-sm text-gray-400">应用总数</p>
          <p className="text-2xl font-bold mt-1">{stats.totalApps}</p>
          <p className="text-xs text-green-500 mt-1">已上架 {stats.approvedApps}</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <p className="text-sm text-gray-400">成交笔数</p>
          <p className="text-2xl font-bold mt-1">{stats.totalPurchases}</p>
          <p className="text-xs text-gray-400 mt-1">累计交易</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <p className="text-sm text-gray-400">平台收入</p>
          <p className="text-2xl font-bold mt-1 text-indigo-600">⚡{formatPoints(stats.platformRevenue)}</p>
          <p className="text-xs text-gray-400 mt-1">积分</p>
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Purchase/Revenue line chart */}
        <div className="lg:col-span-2 rounded-2xl border border-gray-200 bg-white p-5">
          <h3 className="font-bold mb-4">每日交易趋势</h3>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#9ca3af" />
              <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: "1px solid #e5e7eb", fontSize: 12 }}
                labelStyle={{ fontWeight: 600 }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="purchases" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} name="成交笔数" />
              <Line type="monotone" dataKey="revenue" stroke="#a855f7" strokeWidth={2} dot={{ r: 3 }} name="收入(积分)" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Category pie chart */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <h3 className="font-bold mb-4">应用分类分布</h3>
          {appsByCategory.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={appsByCategory}
                  dataKey="count"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius={70}
                  innerRadius={40}
                  paddingAngle={2}
                  label={(props: any) => `${props.category} ${props.count}`}
                  labelLine={false}
                >
                  {appsByCategory.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v, n) => [v, n]} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-48 text-gray-400 text-sm">暂无数据</div>
          )}
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top apps */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <h3 className="font-bold mb-4">热门应用 TOP10</h3>
          {topApps.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                layout="vertical"
                data={topApps.slice(0, 8)}
                margin={{ left: 80, right: 20, top: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} stroke="#9ca3af" />
                <YAxis
                  type="category"
                  dataKey="title"
                  width={80}
                  tick={{ fontSize: 11 }}
                  stroke="#9ca3af"
                  tickFormatter={(v) => v.length > 8 ? v.slice(0, 8) + "…" : v}
                />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: "1px solid #e5e7eb", fontSize: 12 }}
                  formatter={(v, n, props) => [v, n === "downloadCount" ? "下载量" : "购买量"]}
                />
                <Bar dataKey="downloadCount" fill="#6366f1" name="下载量" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-48 text-gray-400 text-sm">暂无数据</div>
          )}
        </div>

        {/* Recent users */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <h3 className="font-bold mb-4">最近注册用户</h3>
          <div className="space-y-3 overflow-y-auto" style={{ maxHeight: 260 }}>
            {recentUsers.map((u) => (
              <div key={u.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 text-white text-sm font-medium">
                    {u.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-700 truncate">{u.name}</span>
                      <span className={`flex-shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                        u.role === "ADMIN" ? "bg-purple-50 text-purple-600" :
                        u.role === "DEVELOPER" ? "bg-indigo-50 text-indigo-600" :
                        "bg-gray-50 text-gray-500"
                      }`}>
                        {ROLE_LABELS[u.role] || u.role}
                      </span>
                    </div>
                    <div className="text-xs text-gray-400 truncate">{u.email}</div>
                  </div>
                </div>
                <div className="flex-shrink-0 flex flex-col items-end gap-0.5 ml-3">
                  <span className="text-xs text-gray-400">
                    {u.lastLoginAt ? `最近 ${timeAgo(u.lastLoginAt)}` : formatDate(u.createdAt)}
                  </span>
                  <span className="text-xs text-amber-500">⚡{formatPoints(u.points)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

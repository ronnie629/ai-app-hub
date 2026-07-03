"use client";

import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts";

export interface MonthlyPoint {
  month: string;
  platformEarning: number;
  totalPoints: number;
  devEarning: number;
  count: number;
}

export function RevenueTrendChart({ data }: { data: MonthlyPoint[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-400">
        暂无趋势数据
      </div>
    );
  }

  // 短月份标签：2025-07 → 7月
  const formatted = data.map((d) => ({
    ...d,
    label: `${parseInt(d.month.split("-")[1], 10)}月`,
  }));

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">近 12 个月收入趋势</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={formatted} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#9ca3af" }} />
            <YAxis tick={{ fontSize: 12, fill: "#9ca3af" }} />
            <Tooltip
              contentStyle={{ borderRadius: 8, fontSize: 12, border: "1px solid #e5e7eb" }}
              formatter={(v) => `⚡${Number(v).toLocaleString()}`}
              labelFormatter={(_l, payload) => {
                const item = payload?.[0]?.payload as MonthlyPoint | undefined;
                return item ? `${item.month}（${item.count} 笔）` : "";
              }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line type="monotone" dataKey="platformEarning" name="平台佣金" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="devEarning" name="开发者收入" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="totalPoints" name="总交易额" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { formatPoints, formatDate } from "@/lib/constants";
import { RevenueTrendChart, MonthlyPoint } from "@/components/revenue-trend-chart";

interface RevenueRecord {
  id: string;
  appId: string;
  appTitle: string;
  developerId: string;
  developerName: string;
  buyerId: string;
  buyerName: string;
  pointsCost: number;
  platformFeeRate: number;
  platformEarning: number;
  developerEarning: number;
  purchaseType: string;
  createdAt: string;
}

interface Summary {
  totalRevenue: number;
  totalPoints: number;
  totalDevEarning: number;
  totalTransactions: number;
}

export function AdminRevenueList() {
  const [records, setRecords] = useState<RevenueRecord[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [monthlyTrend, setMonthlyTrend] = useState<MonthlyPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");

  const fetchData = useCallback(async (p: number, s: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), pageSize: "20" });
      if (s) params.set("search", s);
      const res = await fetch(`/api/admin/revenue?${params}`);
      const data = await res.json();
      if (res.ok) {
        setRecords(data.records);
        setSummary(data.summary);
        setTotalPages(data.totalPages);
        setMonthlyTrend(data.monthlyTrend || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(page, search);
  }, [page, fetchData]);

  const handleSearch = () => {
    setPage(1);
    fetchData(1, search);
  };

  const handleExport = () => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    window.open(`/api/admin/revenue/export?${params.toString()}`, "_blank");
  };

  return (
    <div className="space-y-6">
      {/* 趋势图 */}
      <RevenueTrendChart data={monthlyTrend} />

      {/* Summary cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 p-5 text-white">
            <p className="text-purple-100 text-sm">平台总佣金</p>
            <p className="text-2xl font-bold mt-1">⚡ {formatPoints(summary.totalRevenue)}</p>
          </div>
          <div className="rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 p-5 text-white">
            <p className="text-amber-100 text-sm">总交易额</p>
            <p className="text-2xl font-bold mt-1">⚡ {formatPoints(summary.totalPoints)}</p>
          </div>
          <div className="rounded-2xl bg-gradient-to-br from-green-400 to-emerald-500 p-5 text-white">
            <p className="text-green-100 text-sm">开发者总收入</p>
            <p className="text-2xl font-bold mt-1">⚡ {formatPoints(summary.totalDevEarning)}</p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <p className="text-gray-400 text-sm">总交易笔数</p>
            <p className="text-2xl font-bold mt-1">{summary.totalTransactions}</p>
          </div>
        </div>
      )}

      {/* Search + Export */}
      <div className="flex items-center gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          placeholder="搜索应用名称、开发者或购买者..."
          className="flex-1 rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none"
        />
        <button
          onClick={handleSearch}
          className="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
        >
          搜索
        </button>
        <button
          onClick={handleExport}
          className="rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-1.5"
        >
          <span>⬇</span> 导出 CSV
        </button>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/50">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">应用名称</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">开发者</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">购买者</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase whitespace-nowrap">消费积分</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase whitespace-nowrap">平台抽佣比例</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase whitespace-nowrap">平台佣金</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase whitespace-nowrap">开发者收入</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">类型</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">时间</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-gray-400">加载中...</td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-gray-400">暂无交易记录</td>
                </tr>
              ) : (
                records.map((r) => (
                  <tr key={r.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50 transition-colors">
                    {/* 应用名称 */}
                    <td className="px-4 py-3">
                      <Link href={`/app/${r.appId}`} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-indigo-600 hover:underline">
                        {r.appTitle}
                      </Link>
                    </td>
                    {/* 开发者 */}
                    <td className="px-4 py-3">
                      <Link href={`/user/${r.developerId}`} target="_blank" rel="noopener noreferrer" className="text-sm text-gray-700 hover:text-indigo-600 hover:underline">
                        {r.developerName}
                      </Link>
                    </td>
                    {/* 购买者 */}
                    <td className="px-4 py-3">
                      <Link href={`/user/${r.buyerId}`} target="_blank" rel="noopener noreferrer" className="text-sm text-gray-700 hover:text-indigo-600 hover:underline">
                        {r.buyerName}
                      </Link>
                    </td>
                    {/* 消费积分 */}
                    <td className="px-4 py-3 text-right">
                      <span className="text-sm font-semibold text-amber-600">⚡{formatPoints(r.pointsCost)}</span>
                    </td>
                    {/* 平台抽佣比例 */}
                    <td className="px-4 py-3 text-center">
                      <span className="rounded-full bg-purple-50 px-2.5 py-0.5 text-xs font-medium text-purple-600">
                        {r.pointsCost > 0 ? Math.round(r.platformFeeRate * 100) : 0}%
                      </span>
                    </td>
                    {/* 平台佣金 */}
                    <td className="px-4 py-3 text-right">
                      <span className="text-sm font-semibold text-purple-600">⚡{formatPoints(r.platformEarning)}</span>
                    </td>
                    {/* 开发者收入 */}
                    <td className="px-4 py-3 text-right">
                      <span className="text-sm font-semibold text-green-600">⚡{formatPoints(r.developerEarning)}</span>
                    </td>
                    {/* 类型 */}
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs ${
                        r.purchaseType === "BUYOUT"
                          ? "bg-blue-50 text-blue-600"
                          : "bg-indigo-50 text-indigo-600"
                      }`}>
                        {r.purchaseType === "BUYOUT" ? "买断" : "按次"}
                      </span>
                    </td>
                    {/* 时间 */}
                    <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                      {formatDate(r.createdAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50"
          >
            上一页
          </button>
          <span className="text-sm text-gray-500">
            第 {page} / {totalPages} 页
          </span>
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50"
          >
            下一页
          </button>
        </div>
      )}
    </div>
  );
}

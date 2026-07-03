"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { EmojiPicker } from "@/components/emoji-picker";

interface LevelConfig {
  id?: string;
  userType: "USER" | "DEVELOPER";
  level: number;
  name: string;
  minConsumption: number;
  minApps: number;
  minEarnings: number;
  devShareRate: number;
  color: string;
  icon: string;
}

interface PreviewData {
  total: number;
  downgradeCount: number;
  distribution: Array<{
    level: number;
    name: string;
    count: number;
    samples: Array<{ id: string; name: string; stat: number }>;
  }>;
}

const DEFAULT_LEVELS: LevelConfig[] = [
  // 普通用户
  { userType: "USER", level: 1, name: "入门玩家", minConsumption: 0, minApps: 0, minEarnings: 0, devShareRate: 0, color: "#94a3b8", icon: "🌱" },
  { userType: "USER", level: 2, name: "进阶玩家", minConsumption: 200, minApps: 0, minEarnings: 0, devShareRate: 0, color: "#3b82f6", icon: "🚀" },
  { userType: "USER", level: 3, name: "资深玩家", minConsumption: 1000, minApps: 0, minEarnings: 0, devShareRate: 0, color: "#8b5cf6", icon: "👑" },
  // 开发者
  { userType: "DEVELOPER", level: 1, name: "初级开发者", minConsumption: 0, minApps: 1, minEarnings: 0, devShareRate: 0.7, color: "#22c55e", icon: "🥉" },
  { userType: "DEVELOPER", level: 2, name: "中级开发者", minConsumption: 0, minApps: 3, minEarnings: 200, devShareRate: 0.8, color: "#3b82f6", icon: "🥈" },
  { userType: "DEVELOPER", level: 3, name: "高级开发者", minConsumption: 0, minApps: 5, minEarnings: 1000, devShareRate: 0.9, color: "#8b5cf6", icon: "🥇" },
];

export function AdminLevelConfig() {
  const [levels, setLevels] = useState<LevelConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [previewUser, setPreviewUser] = useState<PreviewData | null>(null);
  const [previewDev, setPreviewDev] = useState<PreviewData | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const fetchLevels = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/levels");
      const data = await res.json();
      if (res.ok && data.levels) {
        setLevels(data.levels);
      }
    } catch {
      setMessage("加载失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLevels();
  }, [fetchLevels]);

  const userLevels = useMemo(
    () => levels.filter((l) => l.userType === "USER").sort((a, b) => a.level - b.level),
    [levels]
  );
  const devLevels = useMemo(
    () => levels.filter((l) => l.userType === "DEVELOPER").sort((a, b) => a.level - b.level),
    [levels]
  );

  const updateUserLevel = (level: number, field: keyof LevelConfig, value: string | number) => {
    setLevels((prev) =>
      prev.map((l) => {
        if (l.userType === "USER" && l.level === level) {
          return { ...l, [field]: typeof l[field] === "number" ? Number(value) : value };
        }
        return l;
      })
    );
  };

  const updateDevLevel = (level: number, field: keyof LevelConfig, value: string | number) => {
    setLevels((prev) =>
      prev.map((l) => {
        if (l.userType === "DEVELOPER" && l.level === level) {
          return { ...l, [field]: typeof l[field] === "number" ? Number(value) : value };
        }
        return l;
      })
    );
  };

  // 实时预览
  const runPreview = useCallback(async () => {
    if (levels.length === 0) return;
    setPreviewLoading(true);
    try {
      const [userRes, devRes] = await Promise.all([
        fetch("/api/admin/levels/preview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userType: "USER", levels: userLevels }),
        }),
        fetch("/api/admin/levels/preview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userType: "DEVELOPER", levels: devLevels }),
        }),
      ]);
      const [userData, devData] = await Promise.all([userRes.json(), devRes.json()]);
      if (userRes.ok) setPreviewUser(userData);
      if (devRes.ok) setPreviewDev(devData);
    } catch {
      // 静默失败
    } finally {
      setPreviewLoading(false);
    }
  }, [levels, userLevels, devLevels]);

  // 每次 levels 变化时自动预览（防抖 800ms）
  useEffect(() => {
    if (loading) return;
    const t = setTimeout(runPreview, 800);
    return () => clearTimeout(t);
  }, [levels, loading, runPreview]);

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch("/api/admin/levels", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ levels }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage("✓ 保存成功！新规则已生效。");
        setTimeout(() => setMessage(""), 3000);
      } else {
        setMessage(data.error || "保存失败");
      }
    } catch {
      setMessage("网络错误");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (!confirm("恢复默认等级配置？这会覆盖你当前的修改（未保存的修改会丢失）。")) return;
    setLevels(DEFAULT_LEVELS);
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-400">加载中...</div>;
  }

  return (
    <div className="space-y-6">
      {/* 规则说明 */}
      <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-4 text-sm text-indigo-700">
        <div className="font-semibold mb-2">📐 分级规则说明</div>
        <ul className="space-y-1 text-xs">
          <li>• <strong>普通用户等级：</strong>按累计消费积分（买断+按次总和）自动升级</li>
          <li>• <strong>降级保护：</strong>连续 90 天无消费自动降一级（最低 1 级）</li>
          <li>• <strong>开发者等级：</strong>同时考核"发布应用数"和"累计赚取积分"，两者都达标才升级</li>
          <li>• <strong>应用数计算：</strong>已下架（REJECTED）的应用不计入</li>
          <li>• <strong>分润规则：</strong>开发者分润 + 平台抽成 = 100%，购买时按开发者当时等级计算</li>
          <li>• <strong>降级保护期：</strong>开发者从高级降回中级后，本月分成仍按高级算（下月 1 号重置）</li>
        </ul>
      </div>

      {/* 普通用户等级 */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <span className="text-xl">👤</span>
            <h2 className="text-lg font-bold">普通用户等级</h2>
          </div>
          {previewUser && (
            <span className="text-xs text-gray-500">
              总人数 <strong className="text-gray-900">{previewUser.total}</strong>
              {previewUser.downgradeCount > 0 && (
                <span className="ml-2 text-amber-600">
                  ⚠️ {previewUser.downgradeCount} 人超过 90 天未消费将被降级
                </span>
              )}
            </span>
          )}
        </div>
        <p className="text-sm text-gray-500 mb-5">按累计消费积分自动升级</p>

        <div className="space-y-3">
          {userLevels.map((lv) => (
            <div
              key={`user-${lv.level}`}
              className="grid grid-cols-12 gap-3 items-end rounded-xl border border-gray-100 p-4 hover:bg-gray-50/50"
            >
              <div className="col-span-1 text-center">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-full text-2xl mx-auto"
                  style={{ backgroundColor: lv.color + "20" }}
                >
                  {lv.icon || "🎮"}
                </div>
                <div className="mt-1 text-xs font-bold" style={{ color: lv.color }}>Lv.{lv.level}</div>
              </div>

              <div className="col-span-3">
                <label className="text-xs text-gray-500">等级名称</label>
                <input
                  type="text"
                  value={lv.name}
                  onChange={(e) => updateUserLevel(lv.level, "name", e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="col-span-3">
                <label className="text-xs text-gray-500">消费积分门槛</label>
                <div className="mt-1 flex items-center gap-1">
                  <span className="text-amber-500">⚡</span>
                  <input
                    type="number"
                    min={0}
                    value={lv.minConsumption}
                    onChange={(e) => updateUserLevel(lv.level, "minConsumption", e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="col-span-2">
                <label className="text-xs text-gray-500">颜色</label>
                <input
                  type="color"
                  value={lv.color}
                  onChange={(e) => updateUserLevel(lv.level, "color", e.target.value)}
                  className="mt-1 h-9 w-full rounded border border-gray-300 cursor-pointer"
                />
              </div>

              <div className="col-span-3">
                <label className="text-xs text-gray-500">图标</label>
                <div className="mt-1">
                  <EmojiPicker
                    value={lv.icon}
                    onChange={(emoji) => updateUserLevel(lv.level, "icon", emoji)}
                    color={lv.color}
                  />
                </div>
              </div>

              {/* 预览人数 */}
              {previewUser && (
                <div className="col-span-12 text-xs text-gray-500 pt-2 border-t border-gray-100">
                  <span className="font-semibold text-gray-700">
                    {previewUser.distribution.find((d) => d.level === lv.level)?.count || 0}
                  </span>{" "}
                  人符合此等级
                  {previewUser.distribution.find((d) => d.level === lv.level)?.samples &&
                    previewUser.distribution.find((d) => d.level === lv.level)!.samples.length > 0 && (
                      <span className="ml-2 text-gray-400">
                        示例：
                        {previewUser.distribution
                          .find((d) => d.level === lv.level)!
                          .samples.map((s) => `${s.name}(${s.stat})`)
                          .join("、")}
                      </span>
                    )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 开发者等级 + 分润配置 */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <span className="text-xl">🚀</span>
            <h2 className="text-lg font-bold">开发者等级 & 分润配置</h2>
          </div>
          {previewDev && (
            <span className="text-xs text-gray-500">
              开发者总人数 <strong className="text-gray-900">{previewDev.total}</strong>
            </span>
          )}
        </div>
        <p className="text-sm text-gray-500 mb-5">
          根据发布应用数和赚取积分自动升级，不同等级享受不同分润比例
        </p>

        <div className="space-y-3">
          {devLevels.map((lv) => (
            <div
              key={`dev-${lv.level}`}
              className="rounded-xl border border-gray-100 p-4 hover:bg-gray-50/50 space-y-3"
            >
              <div className="grid grid-cols-12 gap-3 items-end">
                <div className="col-span-1 text-center">
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-full text-2xl mx-auto"
                    style={{ backgroundColor: lv.color + "20" }}
                  >
                    {lv.icon || "🚀"}
                  </div>
                  <div className="mt-1 text-xs font-bold" style={{ color: lv.color }}>Lv.{lv.level}</div>
                </div>

                <div className="col-span-3">
                  <label className="text-xs text-gray-500">等级名称</label>
                  <input
                    type="text"
                    value={lv.name}
                    onChange={(e) => updateDevLevel(lv.level, "name", e.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div className="col-span-2">
                  <label className="text-xs text-gray-500">最少应用数</label>
                  <input
                    type="number"
                    min={0}
                    value={lv.minApps}
                    onChange={(e) => updateDevLevel(lv.level, "minApps", e.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div className="col-span-2">
                  <label className="text-xs text-gray-500">赚取积分门槛 ⚡</label>
                  <input
                    type="number"
                    min={0}
                    value={lv.minEarnings}
                    onChange={(e) => updateDevLevel(lv.level, "minEarnings", e.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div className="col-span-2">
                  <label className="text-xs text-gray-500">颜色</label>
                  <input
                    type="color"
                    value={lv.color}
                    onChange={(e) => updateDevLevel(lv.level, "color", e.target.value)}
                    className="mt-1 h-9 w-full rounded border border-gray-300 cursor-pointer"
                  />
                </div>

                <div className="col-span-2">
                  <label className="text-xs text-gray-500">图标</label>
                  <EmojiPicker
                    value={lv.icon}
                    onChange={(emoji) => updateDevLevel(lv.level, "icon", emoji)}
                    color={lv.color}
                  />
                </div>
              </div>

              {/* 分润比例（独占一行） */}
              <div className="grid grid-cols-12 gap-3 items-center pt-2 border-t border-gray-100">
                <div className="col-span-4">
                  <label className="text-xs text-gray-500">开发者分润比例</label>
                  <div className="mt-1 flex items-center gap-2">
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={lv.devShareRate}
                      onChange={(e) => updateDevLevel(lv.level, "devShareRate", e.target.value)}
                      className="flex-1 accent-indigo-600"
                    />
                    <span className="text-sm font-bold text-indigo-700 w-12 text-right">
                      {Math.round(lv.devShareRate * 100)}%
                    </span>
                  </div>
                </div>
                <div className="col-span-2 text-center">
                  <label className="text-xs text-gray-500">平台抽成</label>
                  <div className="mt-1 text-sm font-bold text-amber-700">
                    {Math.round((1 - lv.devShareRate) * 100)}%
                  </div>
                </div>
                <div className="col-span-3 text-xs text-gray-500">
                  举例：用户付 100 积分 → 开发者得{" "}
                  <span className="font-bold text-green-700">
                    {Math.floor(100 * lv.devShareRate)} 积分
                  </span>{" "}
                  + 平台得{" "}
                  <span className="font-bold text-amber-700">
                    {100 - Math.floor(100 * lv.devShareRate)} 积分
                  </span>
                </div>
                {previewDev && (
                  <div className="col-span-3 text-xs text-gray-500 text-right">
                    <span className="font-semibold text-gray-700">
                      {previewDev.distribution.find((d) => d.level === lv.level)?.count || 0}
                    </span>{" "}
                    人符合
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-lg bg-indigo-50 px-4 py-3 text-xs text-indigo-600">
          💡 <strong>分润计算公式：</strong>开发者分润 = floor(消费积分 × 分润比例)；平台抽成 = 消费积分 - 开发者分润
          <br />
          ⚠️ <strong>降级保护：</strong>开发者本月内发生等级下降时（如高级→中级），本月已发生和未来交易仍按原等级分润，下月 1 号自动重置。
        </div>
      </div>

      {/* 实时预览汇总 */}
      {(previewUser || previewDev) && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-amber-900">📊 实时预览（修改后立即更新）</h3>
            {previewLoading && <span className="text-xs text-amber-600">计算中...</span>}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {previewUser && (
              <div className="rounded-lg bg-white p-3 border border-amber-100">
                <div className="text-xs font-semibold text-gray-700 mb-2">普通用户分布</div>
                <div className="space-y-1.5">
                  {previewUser.distribution.map((d) => (
                    <div key={`p-user-${d.level}`} className="flex items-center gap-2 text-xs">
                      <span className="w-12 text-gray-600">Lv.{d.level} {d.name}</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full bg-indigo-500"
                          style={{ width: previewUser.total > 0 ? `${(d.count / previewUser.total) * 100}%` : "0%" }}
                        />
                      </div>
                      <span className="w-12 text-right font-semibold text-gray-700">{d.count} 人</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {previewDev && (
              <div className="rounded-lg bg-white p-3 border border-amber-100">
                <div className="text-xs font-semibold text-gray-700 mb-2">开发者分布</div>
                <div className="space-y-1.5">
                  {previewDev.distribution.map((d) => (
                    <div key={`p-dev-${d.level}`} className="flex items-center gap-2 text-xs">
                      <span className="w-12 text-gray-600">Lv.{d.level} {d.name}</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full bg-purple-500"
                          style={{ width: previewDev.total > 0 ? `${(d.count / previewDev.total) * 100}%` : "0%" }}
                        />
                      </div>
                      <span className="w-12 text-right font-semibold text-gray-700">{d.count} 人</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 操作栏 */}
      <div className="flex items-center gap-3 sticky bottom-4 bg-white/80 backdrop-blur rounded-xl p-3 border border-gray-200 shadow-sm">
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-xl bg-indigo-600 px-8 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {saving ? "保存中..." : "保存配置"}
        </button>
        <button
          onClick={handleReset}
          className="rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
        >
          🔄 恢复默认
        </button>
        {message && (
          <span className={`text-sm ${message.includes("成功") ? "text-green-600" : "text-red-600"}`}>
            {message}
          </span>
        )}
      </div>
    </div>
  );
}

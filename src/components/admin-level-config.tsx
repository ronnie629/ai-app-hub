"use client";

import { useState, useEffect, useCallback } from "react";

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

export function AdminLevelConfig() {
  const [levels, setLevels] = useState<LevelConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

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

  const userLevels = levels.filter(l => l.userType === "USER").sort((a, b) => a.level - b.level);
  const devLevels = levels.filter(l => l.userType === "DEVELOPER").sort((a, b) => a.level - b.level);

  const updateLevel = (index: number, field: keyof LevelConfig, value: string | number) => {
    const updated = [...levels];
    const globalIndex = levels.indexOf(index === 0 ? userLevels[0] : levels[0]); // not used directly
    // Find actual index in levels array
    const actualIndex = levels.findIndex(l => l === (userLevels[index] || devLevels[index - userLevels.length]));
    if (actualIndex >= 0) {
      updated[actualIndex] = {
        ...updated[actualIndex],
        [field]: field === "devShareRate" || field === "minConsumption" || field === "minApps" || field === "minEarnings" || field === "level"
          ? Number(value)
          : value,
      };
      setLevels(updated);
    }
  };

  // Simpler approach: update by id/level/type
  const updateUserLevel = (level: number, field: keyof LevelConfig, value: string | number) => {
    setLevels(prev => prev.map(l => {
      if (l.userType === "USER" && l.level === level) {
        return { ...l, [field]: typeof l[field] === "number" ? Number(value) : value };
      }
      return l;
    }));
  };

  const updateDevLevel = (level: number, field: keyof LevelConfig, value: string | number) => {
    setLevels(prev => prev.map(l => {
      if (l.userType === "DEVELOPER" && l.level === level) {
        return { ...l, [field]: typeof l[field] === "number" ? Number(value) : value };
      }
      return l;
    }));
  };

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
        setMessage("保存成功！");
      } else {
        setMessage(data.error || "保存失败");
      }
    } catch {
      setMessage("网络错误");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-400">加载中...</div>;
  }

  return (
    <div className="space-y-8">
      {/* 普通用户等级 */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xl">👤</span>
          <h2 className="text-lg font-bold">普通用户等级</h2>
        </div>
        <p className="text-sm text-gray-500 mb-5">根据平台消费积分自动升级</p>

        <div className="space-y-4">
          {userLevels.map((lv) => (
            <div key={`user-${lv.level}`} className="grid grid-cols-1 md:grid-cols-[60px_1fr_160px_120px] gap-4 items-end rounded-xl border border-gray-100 p-4">
              {/* 等级标识 */}
              <div className="text-center">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-full text-2xl mx-auto"
                  style={{ backgroundColor: lv.color + "20" }}
                >
                  {lv.icon || "🎮"}
                </div>
                <div className="mt-1 text-xs font-medium" style={{ color: lv.color }}>Lv.{lv.level}</div>
              </div>

              {/* 等级名称 */}
              <div>
                <label className="text-xs text-gray-500">等级名称</label>
                <input
                  type="text"
                  value={lv.name}
                  onChange={(e) => updateUserLevel(lv.level, "name", e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                />
              </div>

              {/* 消费门槛 */}
              <div>
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

              {/* 颜色 */}
              <div>
                <label className="text-xs text-gray-500">标识颜色</label>
                <div className="mt-1 flex items-center gap-2">
                  <input
                    type="color"
                    value={lv.color}
                    onChange={(e) => updateUserLevel(lv.level, "color", e.target.value)}
                    className="h-9 w-12 rounded border border-gray-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={lv.icon}
                    onChange={(e) => updateUserLevel(lv.level, "icon", e.target.value)}
                    className="w-16 rounded-lg border border-gray-300 px-2 py-2 text-sm text-center focus:border-indigo-500 focus:outline-none"
                    placeholder="图标"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 开发者等级 */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xl">🚀</span>
          <h2 className="text-lg font-bold">开发者等级 & 分润配置</h2>
        </div>
        <p className="text-sm text-gray-500 mb-5">根据发布应用数和赚取积分自动升级，不同等级享受不同分润比例</p>

        <div className="space-y-4">
          {devLevels.map((lv) => (
            <div key={`dev-${lv.level}`} className="grid grid-cols-1 md:grid-cols-[60px_1fr_120px_120px_140px_120px] gap-4 items-end rounded-xl border border-gray-100 p-4">
              {/* 等级标识 */}
              <div className="text-center">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-full text-2xl mx-auto"
                  style={{ backgroundColor: lv.color + "20" }}
                >
                  {lv.icon || "🚀"}
                </div>
                <div className="mt-1 text-xs font-medium" style={{ color: lv.color }}>Lv.{lv.level}</div>
              </div>

              {/* 等级名称 */}
              <div>
                <label className="text-xs text-gray-500">等级名称</label>
                <input
                  type="text"
                  value={lv.name}
                  onChange={(e) => updateDevLevel(lv.level, "name", e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                />
              </div>

              {/* 发布应用数门槛 */}
              <div>
                <label className="text-xs text-gray-500">最少应用数</label>
                <input
                  type="number"
                  min={0}
                  value={lv.minApps}
                  onChange={(e) => updateDevLevel(lv.level, "minApps", e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                />
              </div>

              {/* 赚取积分门槛 */}
              <div>
                <label className="text-xs text-gray-500">赚取积分门槛</label>
                <div className="mt-1 flex items-center gap-1">
                  <span className="text-amber-500">⚡</span>
                  <input
                    type="number"
                    min={0}
                    value={lv.minEarnings}
                    onChange={(e) => updateDevLevel(lv.level, "minEarnings", e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* 分润比例 */}
              <div>
                <label className="text-xs text-gray-500">开发者分润 / 平台抽成</label>
                <div className="mt-1 flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    max={1}
                    step={0.05}
                    value={lv.devShareRate}
                    onChange={(e) => updateDevLevel(lv.level, "devShareRate", e.target.value)}
                    className="w-16 rounded-lg border border-gray-300 px-2 py-2 text-sm text-center focus:border-indigo-500 focus:outline-none"
                  />
                  <span className="text-sm text-gray-600">
                    {Math.round(lv.devShareRate * 100)}% / {Math.round((1 - lv.devShareRate) * 100)}%
                  </span>
                </div>
              </div>

              {/* 颜色 */}
              <div>
                <label className="text-xs text-gray-500">颜色 / 图标</label>
                <div className="mt-1 flex items-center gap-2">
                  <input
                    type="color"
                    value={lv.color}
                    onChange={(e) => updateDevLevel(lv.level, "color", e.target.value)}
                    className="h-9 w-12 rounded border border-gray-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={lv.icon}
                    onChange={(e) => updateDevLevel(lv.level, "icon", e.target.value)}
                    className="w-16 rounded-lg border border-gray-300 px-2 py-2 text-sm text-center focus:border-indigo-500 focus:outline-none"
                    placeholder="图标"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-lg bg-indigo-50 px-4 py-3 text-xs text-indigo-600">
          💡 分润比例说明：开发者分润 + 平台抽成 = 100%。例如开发者分润 70%，则平台抽成 30%。
          用户购买应用时，系统会根据开发者当前等级自动计算分润。
        </div>
      </div>

      {/* Save button */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-xl bg-indigo-600 px-8 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {saving ? "保存中..." : "保存配置"}
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

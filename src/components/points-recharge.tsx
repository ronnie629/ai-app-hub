"use client";

import { useState } from "react";
import { formatPoints } from "@/lib/constants";

interface PointsRechargeProps {
  currentPoints: number;
}

const RECHARGE_OPTIONS = [
  { points: 100, price: "¥9.9", bonus: 0, label: "体验包" },
  { points: 500, price: "¥45", bonus: 25, label: "标准包" },
  { points: 1000, price: "¥88", bonus: 100, label: "超值包" },
  { points: 5000, price: "¥399", bonus: 800, label: "专业包" },
];

export function PointsRecharge({ currentPoints }: PointsRechargeProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState("");

  const handleRecharge = async () => {
    if (selected === null) return;
    setProcessing(true);
    setMessage("");
    try {
      const res = await fetch("/api/points/recharge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ optionIndex: selected }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(`充值成功！获得 ${data.pointsAdded} 积分，当前余额 ${data.balance} 积分`);
        // Refresh to update navbar
        window.location.reload();
      } else {
        setMessage(data.error || "充值失败");
      }
    } catch {
      setMessage("网络错误，请重试");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div>
      {/* Current balance */}
      <div className="rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 p-6 mb-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-amber-100 text-sm">当前积分余额</p>
            <p className="text-4xl font-bold mt-1">⚡ {formatPoints(currentPoints)}</p>
          </div>
          <span className="text-5xl opacity-50">⚡</span>
        </div>
      </div>

      {/* Recharge options */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {RECHARGE_OPTIONS.map((option, index) => (
          <button
            key={index}
            onClick={() => setSelected(index)}
            className={`rounded-2xl border-2 p-5 text-left card-hover ${
              selected === index
                ? "border-indigo-500 bg-indigo-50"
                : "border-gray-200 bg-white"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-lg">{option.label}</span>
              {option.bonus > 0 && (
                <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs font-medium text-white">
                  +{option.bonus} 赠送
                </span>
              )}
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-amber-600">⚡{formatPoints(option.points + option.bonus)}</span>
              <span className="text-sm text-gray-400">积分</span>
            </div>
            <div className="mt-2 text-lg font-semibold text-gray-700">{option.price}</div>
          </button>
        ))}
      </div>

      {/* Recharge button */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleRecharge}
          disabled={selected === null || processing}
          className="rounded-xl bg-indigo-600 px-8 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {processing ? "充值中..." : "立即充值"}
        </button>
        {selected !== null && (
          <span className="text-sm text-gray-400">
            将支付 {RECHARGE_OPTIONS[selected].price}，获得 ⚡{RECHARGE_OPTIONS[selected].points + RECHARGE_OPTIONS[selected].bonus} 积分
          </span>
        )}
      </div>

      {message && (
        <div className={`mt-4 rounded-lg px-4 py-2.5 text-sm ${
          message.includes("成功") ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
        }`}>
          {message}
        </div>
      )}

      {/* Info */}
      <div className="mt-8 rounded-xl bg-gray-50 p-5 text-sm text-gray-500">
        <h3 className="font-semibold text-gray-700 mb-2">积分说明</h3>
        <ul className="space-y-1 list-disc list-inside">
          <li>积分可用于购买平台上的 AI 应用</li>
          <li>发布应用赚取的积分会自动到账</li>
          <li>积分不可提现，不可转让</li>
          <li>MVP 阶段充值为模拟操作，不产生真实支付</li>
        </ul>
      </div>
    </div>
  );
}

"use client";

import { useState, useRef, useEffect } from "react";

const EMOJI_OPTIONS = [
  // 玩家类
  "🌱", "🚀", "👑", "⭐", "💎", "🔥", "⚡", "✨",
  // 奖牌类
  "🥉", "🥈", "🥇", "🏆", "🎖️",
  // 表情类
  "😎", "🤩", "🥳", "🤖", "🧙", "🦸", "🧞",
  // 工具类
  "🛠️", "⚙️", "🔧", "🔨", "💻", "🖥️", "🎨",
  // 自然类
  "🌟", "🌙", "☀️", "🌈", "🌊", "🌳",
  // 动物类
  "🐱", "🐶", "🦊", "🐼", "🦁", "🐯", "🦄",
  // 食物类
  "🍎", "🍕", "🍔", "🎂", "🍩",
  // 物品类
  "💰", "💵", "💴", "💶", "💷", "💸", "🎁", "🎈",
];

interface EmojiPickerProps {
  value: string;
  onChange: (emoji: string) => void;
  color: string;
}

export function EmojiPicker({ value, onChange, color }: EmojiPickerProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="h-9 w-12 rounded border border-gray-300 flex items-center justify-center text-xl hover:bg-gray-50"
        style={{ backgroundColor: color + "15" }}
      >
        {value || "🎮"}
      </button>
      {open && (
        <div className="absolute z-50 mt-1 right-0 w-64 max-h-64 overflow-y-auto rounded-lg border border-gray-200 bg-white p-2 shadow-lg">
          <div className="grid grid-cols-8 gap-1">
            {EMOJI_OPTIONS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => {
                  onChange(emoji);
                  setOpen(false);
                }}
                className={`h-8 w-8 rounded text-lg hover:bg-indigo-100 ${
                  value === emoji ? "bg-indigo-200" : ""
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

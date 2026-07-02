"use client";

import { useState, useRef, useCallback } from "react";

export interface UploadedImage {
  url: string;
  path: string;
  /** 是否从数据库里已有的 URL 回填而来（不触发新上传） */
  isExisting?: boolean;
}

interface ImageUploaderProps {
  /** 已上传的图片列表（受控） */
  value: UploadedImage[];
  /** 图片列表变化 */
  onChange: (images: UploadedImage[]) => void;
  /** Storage bucket 名 */
  bucket: "app-covers" | "app-screenshots";
  /** 最多可上传张数 */
  maxCount: number;
  /** 单张大小限制提示（MB） */
  maxSizeMB?: number;
  /** 是否允许拖拽排序（仅多图模式） */
  sortable?: boolean;
  /** 标签 */
  label: string;
  /** 提示文本 */
  hint?: string;
}

/**
 * 通用图片上传组件
 * - 支持拖拽、点击选择、删除
 * - 支持多图拖拽排序
 * - 走 /api/upload 接口
 * - 上传中显示 loading
 */
export function ImageUploader({
  value,
  onChange,
  bucket,
  maxCount,
  maxSizeMB = 5,
  sortable = false,
  label,
  hint,
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      setError("");
      const fileArr = Array.from(files);
      const remaining = maxCount - value.length;
      if (fileArr.length > remaining) {
        setError(`最多还能上传 ${remaining} 张图`);
        return;
      }

      setUploading(true);
      const newImages: UploadedImage[] = [];
      for (const file of fileArr) {
        try {
          const fd = new FormData();
          fd.append("file", file);
          fd.append("bucket", bucket);
          const res = await fetch("/api/upload", { method: "POST", body: fd });
          const data = await res.json();
          if (res.ok) {
            newImages.push({ url: data.url, path: data.path });
          } else {
            setError(data.error || "上传失败");
            break;
          }
        } catch {
          setError("网络错误，上传失败");
          break;
        }
      }
      if (newImages.length > 0) {
        onChange([...value, ...newImages]);
      }
      setUploading(false);
    },
    [value, onChange, maxCount, bucket]
  );

  const handleDelete = useCallback(
    async (idx: number) => {
      const target = value[idx];
      if (!target) return;
      setError("");
      try {
        const res = await fetch("/api/upload", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: target.url, bucket }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "删除失败");
          return;
        }
        const next = value.filter((_, i) => i !== idx);
        onChange(next);
      } catch {
        setError("网络错误，删除失败");
      }
    },
    [value, onChange, bucket]
  );

  const handleSortStart = (idx: number) => (e: React.DragEvent) => {
    if (!sortable) return;
    setDraggingIndex(idx);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleSortOver = (e: React.DragEvent) => {
    if (!sortable) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleSortDrop = (idx: number) => (e: React.DragEvent) => {
    if (!sortable) return;
    e.preventDefault();
    if (draggingIndex === null || draggingIndex === idx) {
      setDraggingIndex(null);
      return;
    }
    const next = [...value];
    const [moved] = next.splice(draggingIndex, 1);
    next.splice(idx, 0, moved);
    onChange(next);
    setDraggingIndex(null);
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label} <span className="text-xs text-gray-400">（{value.length}/{maxCount}）</span>
      </label>
      {hint && <p className="text-xs text-gray-400 mb-2">{hint}</p>}

      {/* 已上传图片列表 */}
      {value.length > 0 && (
        <div
          className={`mb-3 grid gap-3 ${
            maxCount === 1 ? "grid-cols-1" : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"
          }`}
        >
          {value.map((img, idx) => (
            <div
              key={img.path}
              draggable={sortable && value.length > 1}
              onDragStart={handleSortStart(idx)}
              onDragOver={handleSortOver}
              onDrop={handleSortDrop(idx)}
              onDragEnd={() => setDraggingIndex(null)}
              className={`group relative aspect-square overflow-hidden rounded-xl border-2 ${
                draggingIndex === idx ? "border-indigo-400 opacity-50" : "border-gray-200"
              } bg-gray-50`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.url} alt={`图片 ${idx + 1}`} className="h-full w-full object-cover" />

              {sortable && value.length > 1 && (
                <div className="absolute top-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-xs text-white">
                  {idx + 1}
                </div>
              )}

              <button
                type="button"
                onClick={() => handleDelete(idx)}
                className="absolute top-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white text-xs opacity-0 transition-opacity group-hover:opacity-100"
                title="删除"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 上传区 */}
      {value.length < maxCount && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            if (e.dataTransfer.files.length > 0) {
              handleFiles(e.dataTransfer.files);
            }
          }}
          onClick={() => fileInputRef.current?.click()}
          className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors ${
            dragOver ? "border-indigo-500 bg-indigo-50" : "border-gray-300 bg-gray-50 hover:bg-gray-100"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple={maxCount > 1}
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                handleFiles(e.target.files);
                e.target.value = ""; // 允许上传同名文件
              }
            }}
          />
          {uploading ? (
            <div className="text-sm text-indigo-600">
              <div className="mb-2 inline-block h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
              <p>上传中...</p>
            </div>
          ) : (
            <>
              <div className="mb-2 text-3xl">📷</div>
              <p className="text-sm font-medium text-gray-700">
                点击或拖拽图片到此处上传
              </p>
              <p className="mt-1 text-xs text-gray-400">
                支持 jpg / png / webp / gif，单张 ≤ {maxSizeMB}MB
                {maxCount > 1 && sortable && "，可拖拽排序"}
              </p>
            </>
          )}
        </div>
      )}

      {error && (
        <p className="mt-2 text-xs text-red-600">{error}</p>
      )}
    </div>
  );
}

/**
 * Storage 类型和工具函数（客户端安全，无 Node.js 依赖）
 */

export const BUCKETS = {
  COVERS: "app-covers",
  SCREENSHOTS: "app-screenshots",
} as const;

export type BucketType = (typeof BUCKETS)[keyof typeof BUCKETS];

/**
 * 从 URL 提取 storage 路径（不含 bucket 前缀，与 Supabase 格式一致）
 *  本地 URL: /uploads/app-covers/user123/file.png → user123/file.png
 *  Supabase: https://xxx.supabase.co/.../app-covers/user123/file.png → user123/file.png
 */
export function extractPathFromUrl(url: string, bucket: BucketType): string | null {
  if (!url) return null;

  if (url.startsWith("/uploads/")) {
    return url.replace(`/uploads/${bucket}/`, "");
  }

  // 兼容旧的 Supabase Storage URL
  const supabaseMarker = `/storage/v1/object/public/${bucket}/`;
  const idx = url.indexOf(supabaseMarker);
  if (idx !== -1) {
    return url.substring(idx + supabaseMarker.length);
  }

  return null;
}

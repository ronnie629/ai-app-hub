import { getSupabaseServer } from "./supabase";

/**
 * Storage 工具函数
 * 集中管理 app-covers 和 app-screenshots 两个公开 bucket
 */

export const BUCKETS = {
  COVERS: "app-covers",
  SCREENSHOTS: "app-screenshots",
} as const;

export type BucketType = (typeof BUCKETS)[keyof typeof BUCKETS];

/**
 * 上传图片到指定 bucket
 * @param file - File 对象
 * @param bucket - bucket 名
 * @param userId - 操作用户 ID（用于隔离文件路径）
 * @returns 公开访问 URL
 */
export async function uploadImage(
  file: File,
  bucket: BucketType,
  userId: string
): Promise<{ url: string; path: string } | { error: string }> {
  const supabase = getSupabaseServer();
  if (!supabase) {
    return { error: "Supabase 未配置，请在 .env 填入 NEXT_PUBLIC_SUPABASE_ANON_KEY 和 SUPABASE_SERVICE_ROLE_KEY" };
  }

  // 校验文件类型
  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (!allowedTypes.includes(file.type)) {
    return { error: `不支持的文件类型: ${file.type}，仅支持 jpg/png/webp/gif` };
  }

  // 校验文件大小（封面 ≤ 5MB，截图 ≤ 8MB）
  const maxSize = bucket === BUCKETS.COVERS ? 5 * 1024 * 1024 : 8 * 1024 * 1024;
  if (file.size > maxSize) {
    return { error: `文件过大（${(file.size / 1024 / 1024).toFixed(1)}MB），最大 ${maxSize / 1024 / 1024}MB` };
  }

  // 生成唯一文件名：userId/timestamp-random.ext
  const ext = file.name.split(".").pop() || "png";
  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2, 8);
  const fileName = `${userId}/${timestamp}-${random}.${ext}`;

  // 转 ArrayBuffer 避免流问题
  const arrayBuffer = await file.arrayBuffer();
  const { data, error } = await supabase.storage.from(bucket).upload(fileName, arrayBuffer, {
    contentType: file.type,
    cacheControl: "3600",
    upsert: false,
  });

  if (error) {
    return { error: `上传失败: ${error.message}` };
  }

  // 拿到公开 URL
  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path);

  return { url: urlData.publicUrl, path: data.path };
}

/**
 * 删除文件
 */
export async function deleteImage(bucket: BucketType, path: string): Promise<{ error?: string }> {
  const supabase = getSupabaseServer();
  if (!supabase) return { error: "Supabase 未配置" };

  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) return { error: `删除失败: ${error.message}` };
  return {};
}

/**
 * 从公开 URL 中提取 storage 路径
 * 公开 URL 格式：https://{project}.supabase.co/storage/v1/object/public/{bucket}/{path}
 */
export function extractPathFromUrl(url: string, bucket: BucketType): string | null {
  if (!url) return null;
  const marker = `/storage/v1/object/public/${bucket}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return url.substring(idx + marker.length);
}

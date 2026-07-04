"server only";

import fs from "fs/promises";
import path from "path";
import sharp from "sharp";
import { BucketType, BUCKETS } from "./storage-types";

/**
 * 本地文件系统存储（仅服务端）
 * 图片保存在项目根目录/uploads/{bucket}/{userId}/ 下
 *
 * 图片标准化策略：
 * - 封面图：统一裁剪为 16:9 (800×450)，中心裁切，输出 WebP
 * - 截图：限制最大宽度 1200px，保持原始比例，输出 WebP
 * - GIF 动图：保持原样不处理
 * 这样无论用户上传什么尺寸/比例的图片，平台展示都能保持一致美观
 */

export { BUCKETS };
export type { BucketType };

// UPLOAD_DIR 可在 .env 里指定绝对路径（生产环境推荐），开发环境默认用 cwd/uploads
const UPLOAD_BASE = process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads");

// 封面图标准尺寸 (16:9)
const COVER_WIDTH = 800;
const COVER_HEIGHT = 450;

// 截图最大宽度
const SCREENSHOT_MAX_WIDTH = 1200;

async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true });
}

/**
 * 处理封面图：裁剪为 16:9，输出 WebP
 */
async function processCoverImage(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer)
    .resize(COVER_WIDTH, COVER_HEIGHT, {
      fit: "cover",
      position: "center",      // 中心裁切，用户无需关心构图
    })
    .webp({ quality: 85 })
    .toBuffer();
}

/**
 * 处理截图：限制最大宽度，保持原始比例，输出 WebP
 */
async function processScreenshot(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer)
    .resize(SCREENSHOT_MAX_WIDTH, undefined, {
      fit: "inside",
      withoutEnlargement: true, // 不放大小图
    })
    .webp({ quality: 85 })
    .toBuffer();
}

/**
 * 上传图片到本地文件系统，上传后自动标准化处理
 */
export async function uploadImage(
  file: File,
  bucket: BucketType,
  userId: string
): Promise<{ url: string; path: string } | { error: string }> {
  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (!allowedTypes.includes(file.type)) {
    return { error: `不支持的文件类型: ${file.type}，仅支持 jpg/png/webp/gif` };
  }

  const maxSize = bucket === BUCKETS.COVERS ? 5 * 1024 * 1024 : 8 * 1024 * 1024;
  if (file.size > maxSize) {
    return { error: `文件过大（${(file.size / 1024 / 1024).toFixed(1)}MB），最大 ${maxSize / 1024 / 1024}MB` };
  }

  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2, 8);
  const arrayBuffer = await file.arrayBuffer();
  const rawBuffer = Buffer.from(arrayBuffer);

  const dir = path.join(UPLOAD_BASE, bucket, userId);
  await ensureDir(dir);

  let finalBuffer: Buffer;
  let ext: string;

  // GIF 动图不处理，保持原样
  if (file.type === "image/gif") {
    finalBuffer = rawBuffer;
    ext = "gif";
  } else if (bucket === BUCKETS.COVERS) {
    // 封面图：裁剪为 16:9 WebP
    finalBuffer = await processCoverImage(rawBuffer);
    ext = "webp";
  } else {
    // 截图：限制最大宽度 WebP
    finalBuffer = await processScreenshot(rawBuffer);
    ext = "webp";
  }

  const fileName = `${timestamp}-${random}.${ext}`;
  const storagePath = `${bucket}/${userId}/${fileName}`;
  const filePath = path.join(UPLOAD_BASE, storagePath);

  await fs.writeFile(filePath, finalBuffer);

  return { url: `/uploads/${storagePath}`, path: storagePath };
}

/**
 * 删除本地文件
 */
export async function deleteImage(bucket: BucketType, storagePath: string): Promise<{ error?: string }> {
  const filePath = path.join(UPLOAD_BASE, bucket, storagePath);
  try {
    await fs.unlink(filePath);
    return {};
  } catch (err: unknown) {
    const e = err as NodeJS.ErrnoException;
    if (e.code === "ENOENT") {
      return {};
    }
    return { error: `删除失败: ${e.message}` };
  }
}

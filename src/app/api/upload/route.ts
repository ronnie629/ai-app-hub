import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { uploadImage, deleteImage, BUCKETS } from "@/lib/storage";
import { BucketType, extractPathFromUrl } from "@/lib/storage-types";

/**
 * POST /api/upload
 * Body: FormData { file: File, bucket: "app-covers" | "app-screenshots" }
 * Returns: { url: string, path: string } | { error: string }
 */
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const bucket = (formData.get("bucket") as BucketType) || BUCKETS.COVERS;

    if (!file) {
      return NextResponse.json({ error: "未提供文件" }, { status: 400 });
    }

    if (bucket !== BUCKETS.COVERS && bucket !== BUCKETS.SCREENSHOTS) {
      return NextResponse.json({ error: "无效的 bucket" }, { status: 400 });
    }

    const result = await uploadImage(file, bucket, session.id);
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json({ error: "上传失败：" + (err as Error).message }, { status: 500 });
  }
}

/**
 * DELETE /api/upload
 * Body: { url: string, bucket: "app-covers" | "app-screenshots" }
 * 从 Storage 删除图片
 */
export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  try {
    const { url, bucket } = await req.json();

    if (!url || !bucket) {
      return NextResponse.json({ error: "参数缺失" }, { status: 400 });
    }

    if (bucket !== BUCKETS.COVERS && bucket !== BUCKETS.SCREENSHOTS) {
      return NextResponse.json({ error: "无效的 bucket" }, { status: 400 });
    }

    const path = extractPathFromUrl(url, bucket);
    if (!path) {
      return NextResponse.json({ error: "无效的图片 URL" }, { status: 400 });
    }

    // 权限检查：确保删除的是自己上传的图片（路径以自己的 userId 开头）
    if (!path.startsWith(`${session.id}/`)) {
      return NextResponse.json({ error: "无权删除该图片" }, { status: 403 });
    }

    const result = await deleteImage(bucket, path);
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Delete error:", err);
    return NextResponse.json({ error: "删除失败：" + (err as Error).message }, { status: 500 });
  }
}

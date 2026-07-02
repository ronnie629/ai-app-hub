import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { safeJsonParse } from "@/lib/constants";

/**
 * PATCH /api/apps/[id]
 * 用途：编辑应用 / 一键下架 / 重新上架
 * body:
 *   - action: "update" | "suspend" | "restore"
 *   - data: { title, description, category, ... } (action=update 时)
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const app = await prisma.app.findUnique({ where: { id } });
    if (!app) {
      return NextResponse.json({ error: "应用不存在" }, { status: 404 });
    }
    if (app.developerId !== session.id && session.role !== "ADMIN") {
      return NextResponse.json({ error: "无权限操作该应用" }, { status: 403 });
    }

    const body = await req.json();
    const { action, data } = body;

    if (action === "suspend") {
      // 一键下架
      const updated = await prisma.app.update({
        where: { id },
        data: { status: "SUSPENDED" },
      });
      return NextResponse.json({ ok: true, app: updated, message: "已下架" });
    }

    if (action === "restore") {
      // 重新上架（回到 PENDING 等待审核）
      const updated = await prisma.app.update({
        where: { id },
        data: { status: "PENDING" },
      });
      return NextResponse.json({ ok: true, app: updated, message: "已重新提交审核" });
    }

    if (action === "update") {
      // 编辑
      if (!data || typeof data !== "object") {
        return NextResponse.json({ error: "参数错误" }, { status: 400 });
      }

      const {
        title,
        description,
        category,
        appType,
        coverImage,
        screenshots,
        price,
        usageInstructions,
        accessUrl,
        tags,
      } = data;

      if (!title?.trim() || !description?.trim()) {
        return NextResponse.json({ error: "应用名称和描述不能为空" }, { status: 400 });
      }

      let screenshotsJson = app.screenshots;
      if (Array.isArray(screenshots)) {
        const list = screenshots
          .map((s: any) => (typeof s === "string" ? s : s?.url))
          .filter(Boolean);
        screenshotsJson = JSON.stringify(list);
      }

      // 编辑后状态变回 PENDING（需重新审核）
      const updated = await prisma.app.update({
        where: { id },
        data: {
          title: title.trim(),
          description: description.trim(),
          category: category || "其他",
          appType: appType || "WEB",
          coverImage: coverImage ?? app.coverImage,
          screenshots: screenshotsJson,
          price: Math.max(0, parseInt(price) || 0),
          usageInstructions: usageInstructions || "",
          accessUrl: accessUrl || "",
          tags: JSON.stringify(tags || []),
          status: "PENDING",
        },
      });
      return NextResponse.json({ ok: true, app: updated, message: "已更新，等待重新审核" });
    }

    return NextResponse.json({ error: "未知操作" }, { status: 400 });
  } catch (err) {
    console.error("PATCH app error:", err);
    return NextResponse.json({ error: "操作失败" }, { status: 500 });
  }
}

/**
 * DELETE /api/apps/[id]
 * 用途：彻底删除应用（连同评价/购买记录）
 * 注：仅开发者本人或管理员可删除
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const app = await prisma.app.findUnique({ where: { id } });
    if (!app) {
      return NextResponse.json({ error: "应用不存在" }, { status: 404 });
    }
    if (app.developerId !== session.id && session.role !== "ADMIN") {
      return NextResponse.json({ error: "无权限操作该应用" }, { status: 403 });
    }

    // 先删依赖数据
    await prisma.review.deleteMany({ where: { appId: id } });
    await prisma.purchase.deleteMany({ where: { appId: id } });
    await prisma.app.delete({ where: { id } });

    return NextResponse.json({ ok: true, message: "已删除" });
  } catch (err) {
    console.error("DELETE app error:", err);
    return NextResponse.json({ error: "删除失败" }, { status: 500 });
  }
}

/**
 * GET /api/apps/[id]
 * 用途：获取单个应用详情（用于编辑回填）
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const app = await prisma.app.findUnique({ where: { id } });
    if (!app) {
      return NextResponse.json({ error: "应用不存在" }, { status: 404 });
    }
    if (app.developerId !== session.id && session.role !== "ADMIN") {
      return NextResponse.json({ error: "无权限" }, { status: 403 });
    }

    return NextResponse.json({
      app: {
        ...app,
        tags: safeJsonParse<string[]>(app.tags, []),
        screenshots: safeJsonParse<string[]>(app.screenshots, []),
      },
    });
  } catch (err) {
    console.error("GET app error:", err);
    return NextResponse.json({ error: "获取失败" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const body = await req.json();
    const {
      title,
      description,
      category,
      appType,
      coverImage,
      coverImagePath,
      screenshots,
      price,
      pricePerUse,
      usageInstructions,
      accessUrl,
      tags,
    } = body;

    if (!title || !description) {
      return NextResponse.json({ error: "应用名称和描述不能为空" }, { status: 400 });
    }

    // 处理截图：支持 [{url, path}] 数组 或 string[] 数组
    let screenshotsJson = "[]";
    if (Array.isArray(screenshots)) {
      const list = screenshots
        .map((s: any) => (typeof s === "string" ? s : s?.url))
        .filter(Boolean);
      screenshotsJson = JSON.stringify(list);
    }

    const app = await prisma.app.create({
      data: {
        title,
        description,
        category: category || "其他",
        appType: appType || "WEB",
        coverImage: coverImage || null,
        price: Math.max(0, parseInt(price) || 0),
        pricePerUse: pricePerUse !== undefined ? parseInt(pricePerUse) ?? -1 : -1,
        usageInstructions: usageInstructions || "",
        accessUrl: accessUrl || "",
        tags: JSON.stringify(tags || []),
        screenshots: screenshotsJson,
        developerId: session.id,
        status: "PENDING",
      },
    });

    return NextResponse.json({ ok: true, appId: app.id });
  } catch (error) {
    console.error("Create app error:", error);
    return NextResponse.json({ error: "发布失败" }, { status: 500 });
  }
}

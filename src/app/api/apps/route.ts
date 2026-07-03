import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { createAppSchema } from "@/lib/validations";

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const body = await req.json();
    
    // Zod 验证
    const validationResult = createAppSchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));
      return NextResponse.json(
        { error: "输入验证失败", details: errors },
        { status: 400 }
      );
    }

    const {
      title,
      description,
      category,
      appType,
      coverImage,
      screenshots,
      price,
      pricePerUse,
      usageInstructions,
      accessUrl,
      tags,
    } = validationResult.data;

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
        price: Math.max(0, price || 0),
        pricePerUse: pricePerUse !== undefined ? pricePerUse : -1,
        usageInstructions: usageInstructions || "",
        accessUrl,
        tags: JSON.stringify(tags || []),
        screenshots: screenshotsJson,
        developerId: session.id,
        status: "PENDING",
      },
    });

    return NextResponse.json({ ok: true, appId: app.id });
  } catch (error) {
    console.error("Create app error:", error);
    
    // 处理 Zod 错误
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "输入验证失败", details: (error as any).errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json({ error: "发布失败" }, { status: 500 });
  }
}

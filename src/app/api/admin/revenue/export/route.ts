import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const search = url.searchParams.get("search") || "";

    const where = search
      ? {
          OR: [
            { app: { title: { contains: search, mode: "insensitive" as const } } },
            { user: { name: { contains: search, mode: "insensitive" as const } } },
            { app: { developer: { name: { contains: search, mode: "insensitive" as const } } } },
          ],
        }
      : {};

    const purchases = await prisma.purchase.findMany({
      where,
      include: {
        app: { select: { id: true, title: true, developer: { select: { id: true, name: true } } } },
        user: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    // BOM 让 Excel 正确识别 UTF-8
    const BOM = "\uFEFF";
    const header = ["交易ID", "应用ID", "应用名称", "开发者ID", "开发者", "购买者ID", "购买者", "消费积分", "抽佣比例(%)", "平台佣金", "开发者收入", "类型", "时间"];
    const rows = purchases.map((p) => [
      p.id,
      p.app.id,
      escapeCsv(p.app.title),
      p.app.developer.id,
      escapeCsv(p.app.developer.name),
      p.user.id,
      escapeCsv(p.user.name),
      p.pointsCost,
      p.pointsCost > 0 ? Math.round(p.platformFeeRate * 100) : 0,
      p.platformEarning,
      p.developerEarning,
      p.purchaseType === "BUYOUT" ? "买断" : "按次",
      p.createdAt.toISOString().replace("T", " ").slice(0, 19),
    ]);

    const csv = BOM + [header, ...rows].map((row) => row.join(",")).join("\n");
    const filename = `revenue_${new Date().toISOString().slice(0, 10)}.csv`;

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Export revenue error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

function escapeCsv(value: string): string {
  if (value == null) return "";
  if (value.includes(",") || value.includes("\"") || value.includes("\n")) {
    return `"${value.replace(/"/g, "\"\"")}"`;
  }
  return value;
}

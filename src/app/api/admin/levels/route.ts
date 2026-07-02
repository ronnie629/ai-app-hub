import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

// Default level configuration
const DEFAULT_LEVELS = [
  // 普通用户等级
  { userType: "USER", level: 1, name: "入门玩家", minConsumption: 0, minApps: 0, minEarnings: 0, devShareRate: 0, color: "#94a3b8", icon: "🌱" },
  { userType: "USER", level: 2, name: "进阶玩家", minConsumption: 200, minApps: 0, minEarnings: 0, devShareRate: 0, color: "#3b82f6", icon: "🚀" },
  { userType: "USER", level: 3, name: "资深玩家", minConsumption: 1000, minApps: 0, minEarnings: 0, devShareRate: 0, color: "#8b5cf6", icon: "👑" },
  // 开发者等级
  { userType: "DEVELOPER", level: 1, name: "初级开发者", minConsumption: 0, minApps: 1, minEarnings: 0, devShareRate: 0.7, color: "#22c55e", icon: "🥉" },
  { userType: "DEVELOPER", level: 2, name: "中级开发者", minConsumption: 0, minApps: 3, minEarnings: 200, devShareRate: 0.8, color: "#3b82f6", icon: "🥈" },
  { userType: "DEVELOPER", level: 3, name: "高级开发者", minConsumption: 0, minApps: 5, minEarnings: 1000, devShareRate: 0.9, color: "#8b5cf6", icon: "🥇" },
];

// GET: Fetch all level configs
export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let levels = await prisma.userLevel.findMany({
      orderBy: [{ userType: "asc" }, { level: "asc" }],
    });

    // If no levels exist, seed defaults
    if (levels.length === 0) {
      await prisma.userLevel.createMany({ data: DEFAULT_LEVELS });
      levels = await prisma.userLevel.findMany({
        orderBy: [{ userType: "asc" }, { level: "asc" }],
      });
    }

    return NextResponse.json({ levels });
  } catch (error) {
    console.error("Fetch levels error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// PUT: Update level configs (bulk)
export async function PUT(req: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { levels } = body as {
      levels: Array<{
        id?: string;
        userType: string;
        level: number;
        name: string;
        minConsumption: number;
        minApps: number;
        minEarnings: number;
        devShareRate: number;
        color: string;
        icon: string;
      }>;
    };

    if (!Array.isArray(levels) || levels.length === 0) {
      return NextResponse.json({ error: "无效的配置数据" }, { status: 400 });
    }

    // Validate devShareRate
    for (const lv of levels) {
      if (lv.userType === "DEVELOPER") {
        if (lv.devShareRate < 0 || lv.devShareRate > 1) {
          return NextResponse.json({ error: `开发者等级「${lv.name}」的分润比例必须在 0-1 之间` }, { status: 400 });
        }
      }
      if (lv.minConsumption < 0 || lv.minApps < 0 || lv.minEarnings < 0) {
        return NextResponse.json({ error: "门槛值不能为负数" }, { status: 400 });
      }
    }

    // Delete all existing and recreate
    await prisma.userLevel.deleteMany({});
    await prisma.userLevel.createMany({
      data: levels.map(lv => ({
        userType: lv.userType,
        level: lv.level,
        name: lv.name,
        minConsumption: lv.minConsumption,
        minApps: lv.minApps,
        minEarnings: lv.minEarnings,
        devShareRate: lv.devShareRate,
        color: lv.color,
        icon: lv.icon,
      })),
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Update levels error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

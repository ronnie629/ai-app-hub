import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create platform config
  await prisma.platformConfig.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      platformFeeRate: 0.1,
      minRechargePoints: 100,
    },
  });
  console.log("✓ Platform config created");

  // Create demo admin user
  const adminExists = await prisma.user.findUnique({ where: { email: "admin@aihub.com" } });
  if (!adminExists) {
    const passwordHash = await bcrypt.hash("123456", 10);
    await prisma.user.create({
      data: {
        name: "管理员",
        email: "admin@aihub.com",
        passwordHash,
        role: "ADMIN",
        points: 99999,
      },
    });
    console.log("✓ Admin user created (admin@aihub.com / 123456)");
  }

  // Create demo developer user
  let dev = await prisma.user.findUnique({ where: { email: "dev@aihub.com" } });
  if (!dev) {
    const passwordHash = await bcrypt.hash("123456", 10);
    dev = await prisma.user.create({
      data: {
        name: "开发者小明",
        email: "dev@aihub.com",
        passwordHash,
        role: "DEVELOPER",
        points: 500,
      },
    });
    console.log("✓ Developer created (dev@aihub.com / 123456)");
  }

  // Create demo apps if dev exists
  if (dev) {
    const appCount = await prisma.app.count();
    if (appCount === 0) {
      const demoApps = [
        {
          title: "AI写作助手",
          description: "基于大语言模型的智能写作工具，支持文章、邮件、报告等多种文体的自动生成和润色优化。",
          category: "文本处理",
          appType: "WEB",
          price: 50,
          pricePerUse: 5,
          accessUrl: "https://example.com/writer",
          usageInstructions: "1. 点击访问地址进入应用\n2. 输入写作需求或关键词\n3. 选择文体和风格\n4. 生成并编辑结果",
          tags: JSON.stringify(["写作", "GPT", "翻译", "摘要"]),
          developerId: dev.id,
          status: "APPROVED",
          downloadCount: 1203,
          rating: 4.5,
          reviewCount: 128,
        },
        {
          title: "智能图片生成器",
          description: "输入文字描述即可生成高质量图片，支持多种风格，可用于设计、营销等场景。",
          category: "图片生成",
          appType: "WEB",
          price: 100,
          pricePerUse: 10,
          accessUrl: "https://example.com/image-gen",
          usageInstructions: "1. 输入图片描述文字\n2. 选择风格和比例\n3. 点击生成\n4. 下载高清图片",
          tags: JSON.stringify(["AI绘画", "图片生成", "设计"]),
          developerId: dev.id,
          status: "APPROVED",
          downloadCount: 2560,
          rating: 4.8,
          reviewCount: 356,
        },
        {
          title: "智能数据分析",
          description: "上传Excel或CSV，自动生成可视化图表和分析报告。",
          category: "数据分析",
          appType: "WEB",
          price: 80,
          pricePerUse: 8,
          accessUrl: "https://example.com/analyst",
          usageInstructions: "1. 上传数据文件\n2. AI自动分析结构\n3. 用自然语言提问\n4. 导出报告和图表",
          tags: JSON.stringify(["数据分析", "Excel", "可视化"]),
          developerId: dev.id,
          status: "APPROVED",
          downloadCount: 890,
          rating: 4.2,
          reviewCount: 67,
        },
        {
          title: "语音转文字API",
          description: "高精度语音识别API，支持中英文，提供标准REST接口方便集成。",
          category: "语音处理",
          appType: "API",
          price: 200,
          pricePerUse: 20,
          accessUrl: "https://api.example.com/stt",
          usageInstructions: "1. 注册获取API Key\n2. 调用REST接口\n3. 上传音频文件\n4. 获取识别结果",
          tags: JSON.stringify(["语音识别", "API", "转文字"]),
          developerId: dev.id,
          status: "APPROVED",
          downloadCount: 3450,
          rating: 4.6,
          reviewCount: 512,
        },
        {
          title: "代码Copilot插件",
          description: "VSCode插件，基于AI的代码补全和生成工具，提升开发效率。",
          category: "开发工具",
          appType: "PLUGIN",
          price: 150,
          pricePerUse: 15,
          accessUrl: "https://example.com/copilot",
          usageInstructions: "1. 在VSCode安装插件\n2. 登录账号\n3. 开始写代码，AI自动补全\n4. 使用快捷键触发建议",
          tags: JSON.stringify(["代码", "VSCode", "插件", "Copilot"]),
          developerId: dev.id,
          status: "APPROVED",
          downloadCount: 5100,
          rating: 4.9,
          reviewCount: 890,
        },
        {
          title: "待审核翻译工具",
          description: "多语言AI翻译应用，支持实时翻译和文档翻译。",
          category: "文本处理",
          appType: "WEB",
          price: 30,
          pricePerUse: 3,
          accessUrl: "https://example.com/translate",
          usageInstructions: "1. 输入或粘贴文本\n2. 选择目标语言\n3. 点击翻译\n4. 复制或下载结果",
          tags: JSON.stringify(["翻译", "多语言"]),
          developerId: dev.id,
          status: "PENDING",
        },
      ];

      for (const app of demoApps) {
        await prisma.app.create({ data: app });
      }
      console.log(`✓ Created ${demoApps.length} demo apps`);
    }
  }

  // Create demo regular user
  const userExists = await prisma.user.findUnique({ where: { email: "user@aihub.com" } });
  if (!userExists) {
    const passwordHash = await bcrypt.hash("654321", 10);
    await prisma.user.create({
      data: {
        name: "普通用户",
        email: "user@aihub.com",
        passwordHash,
        role: "USER",
        points: 500,
      },
    });
    console.log("✓ Demo user created (user@aihub.com / 654321)");
  }

  console.log("\n🎉 Seed completed!");
  console.log("\nDemo accounts:");
  console.log("  Admin:     admin@aihub.com / 123456");
  console.log("  Developer: dev@aihub.com / 123456");
  console.log("  User:      user@aihub.com / 654321");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

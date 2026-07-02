const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const sqls = [
    `CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      "passwordHash" TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'USER',
      points INTEGER NOT NULL DEFAULT 0,
      bio TEXT,
      avatar TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS apps (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT '其他',
      "appType" TEXT NOT NULL DEFAULT 'WEB',
      "coverImage" TEXT,
      screenshots TEXT NOT NULL DEFAULT '[]',
      price INTEGER NOT NULL DEFAULT 0,
      "usageInstructions" TEXT NOT NULL DEFAULT '',
      "accessUrl" TEXT NOT NULL DEFAULT '',
      tags TEXT NOT NULL DEFAULT '[]',
      "developerId" TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'PENDING',
      "downloadCount" INTEGER NOT NULL DEFAULT 0,
      rating DOUBLE PRECISION NOT NULL DEFAULT 0,
      "reviewCount" INTEGER NOT NULL DEFAULT 0,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL
    )`,
    `ALTER TABLE apps ADD CONSTRAINT fk_apps_developer FOREIGN KEY ("developerId") REFERENCES users(id)`,
    `CREATE TABLE IF NOT EXISTS purchases (
      id TEXT PRIMARY KEY,
      "userId" TEXT NOT NULL,
      "appId" TEXT NOT NULL,
      "pointsCost" INTEGER NOT NULL,
      "developerEarning" INTEGER NOT NULL DEFAULT 0,
      "platformEarning" INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'COMPLETED',
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    `ALTER TABLE purchases ADD CONSTRAINT fk_purchases_user FOREIGN KEY ("userId") REFERENCES users(id)`,
    `ALTER TABLE purchases ADD CONSTRAINT fk_purchases_app FOREIGN KEY ("appId") REFERENCES apps(id)`,
    `CREATE TABLE IF NOT EXISTS points_transactions (
      id TEXT PRIMARY KEY,
      "userId" TEXT NOT NULL,
      type TEXT NOT NULL,
      amount INTEGER NOT NULL,
      "balanceAfter" INTEGER NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      "relatedId" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    `ALTER TABLE points_transactions ADD CONSTRAINT fk_pt_user FOREIGN KEY ("userId") REFERENCES users(id)`,
    `CREATE TABLE IF NOT EXISTS reviews (
      id TEXT PRIMARY KEY,
      "userId" TEXT NOT NULL,
      "appId" TEXT NOT NULL,
      rating INTEGER NOT NULL,
      comment TEXT NOT NULL DEFAULT '',
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    `ALTER TABLE reviews ADD CONSTRAINT fk_reviews_app FOREIGN KEY ("appId") REFERENCES apps(id)`,
    `CREATE UNIQUE INDEX IF NOT EXISTS reviews_user_app ON reviews("userId", "appId")`,
    `CREATE TABLE IF NOT EXISTS platform_config (
      id TEXT PRIMARY KEY DEFAULT 'default',
      "platformFeeRate" DOUBLE PRECISION NOT NULL DEFAULT 0.1,
      "minRechargePoints" INTEGER NOT NULL DEFAULT 100,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL
    )`
  ];

  for (const sql of sqls) {
    try {
      await prisma.$executeRawUnsafe(sql);
    } catch (e) {
      // Skip duplicate constraint errors
      if (!e.message?.includes('already exists') && !e.message?.includes('42710')) {
        console.log('Note:', e.message?.split('\n')[0] || e.message);
      }
    }
  }

  console.log('Tables created!');

  // Seed data
  const hash = await bcrypt.hash('123456', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@aihub.com' },
    update: {},
    create: { email: 'admin@aihub.com', passwordHash: hash, name: '管理员', role: 'ADMIN', points: 99999 }
  });

  const dev = await prisma.user.upsert({
    where: { email: 'dev@aihub.com' },
    update: {},
    create: { email: 'dev@aihub.com', passwordHash: hash, name: '开发者小明', role: 'DEVELOPER', points: 500 }
  });

  const user = await prisma.user.upsert({
    where: { email: 'user@aihub.com' },
    update: {},
    create: { email: 'user@aihub.com', passwordHash: hash, name: '普通用户', role: 'USER', points: 500 }
  });

  const ac = await prisma.app.count();
  if (ac === 0) {
    await prisma.app.createMany({ data: [
      { title: 'AI写作助手', description: '基于大语言模型的智能写作工具，支持文章、邮件、报告等', category: '文本处理', price: 50, appType: 'WEB', accessUrl: 'https://example.com/writer', developerId: dev.id, status: 'APPROVED', rating: 4.5, downloadCount: 1203 },
      { title: '智能图片生成器', description: '输入文字描述即可生成高质量图片，支持多种风格', category: '图片生成', price: 100, appType: 'WEB', accessUrl: 'https://example.com/image-gen', developerId: dev.id, status: 'APPROVED', rating: 4.8, downloadCount: 2560 },
      { title: '智能数据分析', description: '上传Excel或CSV，自动生成可视化图表和分析报告', category: '数据分析', price: 80, appType: 'WEB', accessUrl: 'https://example.com/analyst', developerId: dev.id, status: 'APPROVED', rating: 4.2, downloadCount: 890 },
      { title: '语音转文字API', description: '高精度语音识别API，支持中英文，标准REST接口', category: '语音处理', price: 200, appType: 'API', accessUrl: 'https://api.example.com/stt', developerId: dev.id, status: 'APPROVED', rating: 4.6, downloadCount: 3450 },
      { title: '代码Copilot插件', description: 'VSCode插件，AI代码补全和生成工具', category: '开发工具', price: 150, appType: 'PLUGIN', accessUrl: 'https://example.com/copilot', developerId: dev.id, status: 'APPROVED', rating: 4.9, downloadCount: 5100 },
      { title: '待审核翻译工具', description: '多语言AI翻译应用', category: '文本处理', price: 30, appType: 'WEB', accessUrl: 'https://example.com/translate', developerId: dev.id, status: 'PENDING' }
    ]});
    console.log('Apps created: 6');
  }

  await prisma.platformConfig.upsert({
    where: { id: 'default' },
    update: { platformFeeRate: 0.1, minRechargePoints: 100 },
    create: { id: 'default', platformFeeRate: 0.1, minRechargePoints: 100 }
  });

  console.log('Seed complete! Users: 3, Apps: 6');
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => { console.error(e); prisma.$disconnect(); process.exit(1); });

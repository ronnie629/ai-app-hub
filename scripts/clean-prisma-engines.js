// 仅在 Linux serverless 部署时执行：删除非目标平台的 Prisma query engine binary
// EdgeOne Node SSR 用的是 linux-musl-openssl-3.0.x
const fs = require("fs");
const path = require("path");

// 只在 Linux 上执行清理（保留 macOS/Windows 引擎供本地开发）
if (process.platform !== "linux") {
  console.log(`[clean-prisma-engines] platform=${process.platform}, skipping`);
  process.exit(0);
}

const KEEP = "libquery_engine-linux-musl-openssl-3.0.x.so.node";
const prismaClientDir = path.join(__dirname, "..", "node_modules", ".prisma", "client");

if (!fs.existsSync(prismaClientDir)) {
  console.log("[clean-prisma-engines] prisma client not found, skipping");
  process.exit(0);
}

let removed = 0;
let saved = 0;
for (const file of fs.readdirSync(prismaClientDir)) {
  if (file.startsWith("libquery_engine-") && file !== KEEP) {
    const filePath = path.join(prismaClientDir, file);
    const stat = fs.statSync(filePath);
    fs.unlinkSync(filePath);
    removed++;
    saved += stat.size;
    console.log(`[clean-prisma-engines] removed ${file} (${(stat.size / 1024 / 1024).toFixed(1)}M)`);
  }
}
console.log(`[clean-prisma-engines] done. removed ${removed} files, saved ${(saved / 1024 / 1024).toFixed(1)}M`);

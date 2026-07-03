// 仅在 Linux serverless 部署时执行：删除冗余依赖以符合 128MiB 限制
// EdgeOne Node SSR 用的是 linux-musl
const fs = require("fs");
const path = require("path");

// 只在 Linux 上执行清理（保留 macOS/Windows 资源供本地开发）
if (process.platform !== "linux") {
  console.log(`[clean-deploy-deps] platform=${process.platform}, skipping`);
  process.exit(0);
}

let totalSaved = 0;
function removePattern(dir, pattern) {
  if (!fs.existsSync(dir)) return;
  for (const file of fs.readdirSync(dir)) {
    if (pattern.test(file)) {
      const fp = path.join(dir, file);
      const stat = fs.statSync(fp);
      if (stat.isFile()) {
        fs.unlinkSync(fp);
        totalSaved += stat.size;
        console.log(`[clean-deploy-deps] removed ${fp.replace(__dirname + "/../", "")} (${(stat.size/1024/1024).toFixed(1)}M)`);
      }
    }
  }
}

// 1. Prisma 引擎：只保留 linux-musl 版本
const prismaClientDir = path.join(__dirname, "..", "node_modules", ".prisma", "client");
removePattern(prismaClientDir, /^libquery_engine-(?!linux-musl).*\.(dylib|so)\.node$/);
removePattern(prismaClientDir, /^libquery_engine-debian.*\.so\.node$/);

// 2. @prisma/engines 整个 39M：deploy 时 schema-engine 用不到
const prismaEnginesDir = path.join(__dirname, "..", "node_modules", "@prisma", "engines");
if (fs.existsSync(prismaEnginesDir)) {
  for (const f of fs.readdirSync(prismaEnginesDir)) {
    if (/^schema-engine-(?!linux-musl)/.test(f) || /libquery_engine/.test(f)) {
      const fp = path.join(prismaEnginesDir, f);
      const st = fs.statSync(fp);
      if (st.isFile()) {
        fs.unlinkSync(fp);
        totalSaved += st.size;
        console.log(`[clean-deploy-deps] removed @prisma/engines/${f} (${(st.size/1024/1024).toFixed(1)}M)`);
      }
    }
  }
}

// 3. 平台特定包：macOS / Windows 专用 binary
const platformPatterns = [
  "lightningcss-darwin-arm64",
  "lightningcss-darwin-x64",
  "lightningcss-win32-x64-msvc",
  "@img/sharp-darwin-arm64",
  "@img/sharp-darwin-x64",
  "@img/sharp-win32-x64",
  "@esbuild/darwin-arm64",
  "@esbuild/darwin-x64",
  "@esbuild/win32-x64",
  "@rollup/rollup-darwin-arm64",
  "@rollup/rollup-darwin-x64",
];
for (const pkg of platformPatterns) {
  const dir = path.join(__dirname, "..", "node_modules", pkg);
  if (fs.existsSync(dir)) {
    const size = fs.statSync(dir).size;
    fs.rmSync(dir, { recursive: true, force: true });
    totalSaved += size;
    console.log(`[clean-deploy-deps] removed ${pkg} (${(size/1024/1024).toFixed(1)}M)`);
  }
}

// 4. tsx / typescript：devDeps 但 postinstall 不需要
const devPackages = ["tsx", "typescript", "@types"];
for (const pkg of devPackages) {
  const dir = path.join(__dirname, "..", "node_modules", pkg);
  if (fs.existsSync(dir)) {
    const size = fs.statSync(dir).size;
    fs.rmSync(dir, { recursive: true, force: true });
    totalSaved += size;
    console.log(`[clean-deploy-deps] removed ${pkg} (${(size/1024/1024).toFixed(1)}M)`);
  }
}

console.log(`[clean-deploy-deps] done. saved ${(totalSaved/1024/1024).toFixed(1)}M`);

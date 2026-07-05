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

// 1. Prisma 引擎：根据当前 Linux 发行版保留正确的引擎
//    Ubuntu/Debian → 保留 debian-openssl-3.0.x (glibc)
//    Alpine → 保留 linux-musl (musl)
const prismaClientDir = path.join(__dirname, "..", "node_modules", ".prisma", "client");
// 检测当前是否使用 musl（Alpine 等）
const isMusl = (() => {
  try {
    // ldd 如果存在且输出包含 musl，则为 musl 系统
    const { execSync } = require("child_process");
    const out = execSync("ldd --version 2>&1 || true", { encoding: "utf8" });
    return out.includes("musl");
  } catch { return false; }
})();

const keepPattern = isMusl ? "linux-musl" : "debian";
console.log(`[clean-deploy-deps] detected ${isMusl ? "musl" : "glibc"} libc, keeping "${keepPattern}" engine`);

// 移除非当前平台需要的 Prisma 引擎
const engineFiles = fs.readdirSync(prismaClientDir).filter(f => /^libquery_engine-/.test(f));
for (const f of engineFiles) {
  if (!f.includes(keepPattern)) {
    const fp = path.join(prismaClientDir, f);
    const stat = fs.statSync(fp);
    fs.unlinkSync(fp);
    totalSaved += stat.size;
    console.log(`[clean-deploy-deps] removed ${fp.replace(__dirname + "/../", "")} (${(stat.size/1024/1024).toFixed(1)}M)`);
  }
}

// 2. @prisma/engines：移除不需要的引擎文件
const prismaEnginesDir = path.join(__dirname, "..", "node_modules", "@prisma", "engines");
if (fs.existsSync(prismaEnginesDir)) {
  const keepSuffix = isMusl ? "linux-musl" : "debian";
  for (const f of fs.readdirSync(prismaEnginesDir)) {
    // 移除所有 schema-engine-xxx 除了当前平台需要的
    const isSchemaEngine = /^schema-engine-/.test(f);
    const isLibEngine = /libquery_engine/.test(f);
    if (isSchemaEngine || isLibEngine) {
      if (!f.includes(keepSuffix)) {
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

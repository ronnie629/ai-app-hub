/** @type {import('next').NextConfig} */
const nextConfig = {
  // standalone 模式部署，输出 .next/standalone/
  output: "standalone",
  // Prisma engine + Sharp native 文件需要被追踪（standalone 模式不会自动包含 .node 二进制）
  outputFileTracingIncludes: {
    "/*": [
      "./node_modules/.prisma/client/**/*",
      "./node_modules/sharp/**/*",
    ],
  },
  // 部署环境只装 production deps，devDeps 缺失
  // 关掉 build 时的 TypeScript / ESLint 检查
  typescript: {
    ignoreBuildErrors: true,  // 跳过 TS 类型检查，线上构建不阻塞
  },
  // ESLint config moved to eslint.config.mjs (Next.js 16+)
  // 全局默认 dynamic 渲染：src/app/layout.tsx 里已加
  // export const dynamic = "force-dynamic"，避免 build 阶段预渲染触发 DB 查询
  // 图片均存于本地 /uploads/，无需配置 remotePatterns
  images: {
    formats: ["image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },
  turbopack: {
    root: __dirname,
  },
};

module.exports = nextConfig;

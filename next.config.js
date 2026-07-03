/** @type {import('next').NextConfig} */
const nextConfig = {
  // CloudBase / 容器部署：使用 standalone 模式
  // 输出 .next/standalone/ 目录，包含精简的 node_modules 和 server.js
  output: "standalone",
  // Prisma engine 文件需要被追踪
  outputFileTracingIncludes: {
    "/*": ["./node_modules/.prisma/client/**/*"],
  },
  // 部署环境只装 production deps，devDeps 缺失
  // 关掉 build 时的 TypeScript / ESLint 检查
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // 全局默认 dynamic 渲染：src/app/layout.tsx 里已加
  // export const dynamic = "force-dynamic"，避免 build 阶段预渲染触发 DB 查询
};

module.exports = nextConfig;

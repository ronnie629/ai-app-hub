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
};

module.exports = nextConfig;

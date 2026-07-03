/** @type {import('next').NextConfig} */
const nextConfig = {
  // Prisma engine 文件需要被追踪
  outputFileTracingIncludes: {
    "/*": ["./node_modules/.prisma/client/**/*"],
  },
  // EdgeOne 用 @edgeone/opennextjs-pages generator 处理 server bundle
  // 不要用 output: 'standalone'，会干扰 EdgeOne 的资源打包
  // 关掉 build 时的 TypeScript 类型检查，CI/部署环境不装 devDeps 也能 build
  // 本地开发走 IDE/手动 tsc 仍可做类型校验
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;

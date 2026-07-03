/** @type {import('next').NextConfig} */
const nextConfig = {
  // Prisma engine 文件需要被追踪
  outputFileTracingIncludes: {
    "/*": ["./node_modules/.prisma/client/**/*"],
  },
  // EdgeOne 用 @edgeone/opennextjs-pages generator 处理 server bundle
  // 不要用 output: 'standalone'，会干扰 EdgeOne 的资源打包
};

module.exports = nextConfig;

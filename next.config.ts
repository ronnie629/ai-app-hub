import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 关键：standalone 模式让 Next.js 只打包实际用到的依赖，
  // 避免 Serverless 函数超过 EdgeOne 128MiB 限制
  output: "standalone",
  // Vercel/EdgeOne serverless 都需要追踪 Prisma engine 文件
  outputFileTracingIncludes: {
    "/*": ["./node_modules/.prisma/client/**/*"],
  },
};

export default nextConfig;

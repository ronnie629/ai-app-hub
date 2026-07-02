import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Vercel serverless 需要追踪 Prisma engine 文件
  outputFileTracingIncludes: {
    "/*": ["./node_modules/.prisma/client/**/*"],
  },
};

export default nextConfig;

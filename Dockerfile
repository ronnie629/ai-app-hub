# ===== Stage 1: deps =====
FROM node:20-alpine AS deps

WORKDIR /app

# 装 Python + make + g++ 给 Prisma query engine 编译用
RUN apk add --no-cache libc6-compat openssl

# 仅复制 lock 文件，利用 Docker 缓存层
COPY package.json package-lock.json* ./

# 装 deps（含 devDeps，用于 build）
RUN npm ci

# ===== Stage 2: builder =====
FROM node:20-alpine AS builder

WORKDIR /app

RUN apk add --no-cache libc6-compat openssl

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 关掉 Next.js 遥测
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# 生成 Prisma client
RUN npx prisma generate

# 构建（next.config.js 里已设 typescript.ignoreBuildErrors）
RUN npm run build

# ===== Stage 3: runner =====
FROM node:20-alpine AS runner

WORKDIR /app

RUN apk add --no-cache libc6-compat openssl

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# 创建非 root 用户
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

# standalone 产物 + 静态资源
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Prisma engine 必须保留在 standalone 目录
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]

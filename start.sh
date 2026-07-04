#!/bin/bash
# AIHub 启动脚本
# 建立 SSH 隧道连接远程 MySQL，然后启动 Next.js 开发服务器

KEY_FILE="$HOME/Downloads/workbuddy.pem"
SSH_USER="ubuntu"
SSH_HOST="124.221.118.160"
LOCAL_PORT="3307"
REMOTE_PORT="3306"

echo "🚀 AIHub 启动中..."

# 检查 SSH 隧道是否已存在
if lsof -i :$LOCAL_PORT -sTCP:LISTEN &>/dev/null; then
  echo "✅ SSH 隧道已在运行 (localhost:$LOCAL_PORT → $SSH_HOST:$REMOTE_PORT)"
else
  echo "🔐 建立 SSH 隧道..."
  ssh -i "$KEY_FILE" -f -N -L ${LOCAL_PORT}:127.0.0.1:${REMOTE_PORT} ${SSH_USER}@${SSH_HOST} -o ExitOnForwardFailure=yes
  if [ $? -eq 0 ]; then
    echo "✅ SSH 隧道建立成功"
  else
    echo "❌ SSH 隧道建立失败，请检查密钥文件: $KEY_FILE"
    exit 1
  fi
fi

# 启动 Next.js
echo "🌐 启动 Next.js..."
npm run dev

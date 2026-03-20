#!/bin/sh
###
 # @Author: Await
 # @Date: 2025-04-02 17:04:06
 # @LastEditors: Await
 # @LastEditTime: 2025-10-02 14:00:00
 # @Description: 单容器启动脚本 - 启动 Nginx、后端和前端服务
###

# 设置环境变量
export NODE_ENV=production

# 创建日志目录
mkdir -p /var/log/nginx /app/logs

# 启动 Nginx
echo "正在启动 Nginx..."
nginx -t && nginx
NGINX_PID=$!

# 启动后端服务（后台运行）
echo "正在启动后端服务..."
cd /app/backend
node dist/app.js &
BACKEND_PID=$!

# 等待后端服务启动
sleep 5

# 启动前端服务（使用 standalone 模式）
echo "正在启动前端服务..."
cd /app/frontend/.next/standalone
PORT=3000 HOSTNAME=0.0.0.0 node server.js &
FRONTEND_PID=$!

# 输出进程ID
echo "Nginx 进程ID: $NGINX_PID"
echo "后端服务进程ID: $BACKEND_PID"
echo "前端服务进程ID: $FRONTEND_PID"
echo ""
echo "✅ 所有服务已启动"
echo "📡 访问地址: http://localhost"
echo "📊 健康检查: http://localhost/health"

# 捕获SIGTERM信号，确保正确关闭所有服务
trap 'echo "正在关闭服务..."; kill $FRONTEND_PID $BACKEND_PID; nginx -s quit; exit 0' SIGTERM SIGINT

# 保持容器运行
wait 
#!/bin/sh
###
 # @Author: Await
 # @Date: 2025-04-02 17:04:06
 # @LastEditors: Await
 # @LastEditTime: 2025-04-02 17:04:12
 # @Description: 请填写简介
### 

# 设置环境变量
export NODE_ENV=production

# 启动后端服务（后台运行）
echo "正在启动后端服务..."
cd /app/backend
node dist/app.js &
BACKEND_PID=$!

# 等待后端服务启动
sleep 5

# 启动前端服务
echo "正在启动前端服务..."
cd /app/frontend
npm start &
FRONTEND_PID=$!

# 输出进程ID
echo "后端服务进程ID: $BACKEND_PID"
echo "前端服务进程ID: $FRONTEND_PID"

# 捕获SIGTERM信号，确保正确关闭所有服务
trap 'echo "正在关闭服务..."; kill $FRONTEND_PID $BACKEND_PID; exit 0' SIGTERM

# 保持容器运行
wait 
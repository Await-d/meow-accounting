# 构建阶段 - 前端
FROM node:18-alpine AS frontend-builder
WORKDIR /app/frontend

# 安装pnpm
RUN npm install -g pnpm

# 设置构建时环境变量 - 生产环境使用相对路径通过Nginx代理
ARG NEXT_PUBLIC_API_URL=/api
ARG BACKEND_URL=http://localhost:3001
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV BACKEND_URL=$BACKEND_URL
ENV NODE_ENV=production

# 输出环境变量以便调试
RUN echo "Building with NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL"

# 复制包管理文件
COPY frontend/package.json ./
COPY frontend/pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# 复制源码并构建
COPY frontend/ ./
RUN pnpm run build

# 验证构建结果中的环境变量
RUN echo "Build completed. Checking if API URL is embedded..."
RUN find .next -name "*.js" -exec grep -l "NEXT_PUBLIC_API_URL\|/api\|localhost:3001" {} \; | head -5 || true

# 构建阶段 - 后端
FROM node:18-alpine AS backend-builder
WORKDIR /app/backend

# 安装构建工具和pnpm
RUN apk add --no-cache python3 make g++
RUN npm install -g pnpm

# 复制包管理文件
COPY backend/package.json ./
COPY backend/pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --ignore-scripts=false || pnpm install --frozen-lockfile
RUN cd node_modules/.pnpm/sqlite3@5.1.7/node_modules/sqlite3 && npm run install || true
RUN cd node_modules/.pnpm/bcrypt@5.1.1/node_modules/bcrypt && npm run install || true

# 复制源码并构建
COPY backend/ ./
RUN pnpm run build

# 生产阶段
FROM node:18-alpine
WORKDIR /app

# 安装构建工具、pnpm、curl和nginx（单容器部署）
RUN apk add --no-cache python3 make g++ curl nginx
RUN npm install -g pnpm

# 创建数据目录
RUN mkdir -p /app/data

# 复制后端构建产物和依赖信息
COPY --from=backend-builder /app/backend/dist /app/backend/dist
COPY --from=backend-builder /app/backend/package.json /app/backend/package.json
COPY --from=backend-builder /app/backend/pnpm-lock.yaml /app/backend/pnpm-lock.yaml

# 直接复制构建阶段的 node_modules（已编译的原生模块）
COPY --from=backend-builder /app/backend/node_modules /app/backend/node_modules

# 安装后端生产依赖
WORKDIR /app/backend

# 复制前端 standalone 构建产物
COPY --from=frontend-builder /app/frontend/.next/standalone /app/frontend/.next/standalone
COPY --from=frontend-builder /app/frontend/.next/static /app/frontend/.next/standalone/.next/static
COPY --from=frontend-builder /app/frontend/public /app/frontend/.next/standalone/public
COPY --from=frontend-builder /app/frontend/next.config.js /app/frontend/next.config.js

# Standalone 模式已包含所有依赖，无需再次安装
WORKDIR /app/frontend

# 添加 Nginx 配置（单容器版本）
COPY nginx-single.conf /etc/nginx/http.d/default.conf

# 添加启动脚本
WORKDIR /app
COPY start.sh ./
RUN chmod +x start.sh

# 设置环境变量 - 生产环境使用相对路径
ENV NODE_ENV=production
ENV FRONTEND_URL=http://localhost:3000
ENV BACKEND_URL=http://localhost:3001
ENV NEXT_PUBLIC_API_URL=/api

# 暴露端口（只暴露 Nginx 端口）
EXPOSE 80
EXPOSE 443

# 启动服务
CMD ["./start.sh"] 
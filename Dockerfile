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
COPY frontend/package.json frontend/pnpm-lock.yaml ./
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

# 安装pnpm
RUN npm install -g pnpm

# 复制包管理文件
COPY backend/package.json backend/pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# 复制源码并构建
COPY backend/ ./
RUN pnpm run build

# 生产阶段
FROM node:18-alpine
WORKDIR /app

# 安装pnpm
RUN npm install -g pnpm

# 创建数据目录
RUN mkdir -p /app/data

# 复制后端构建产物和依赖信息
COPY --from=backend-builder /app/backend/dist /app/backend/dist
COPY --from=backend-builder /app/backend/package.json /app/backend/
COPY --from=backend-builder /app/backend/pnpm-lock.yaml /app/backend/

# 安装后端生产依赖
WORKDIR /app/backend
RUN pnpm install --prod --frozen-lockfile

# 复制前端构建产物和依赖信息
COPY --from=frontend-builder /app/frontend/.next /app/frontend/.next
COPY --from=frontend-builder /app/frontend/public /app/frontend/public
COPY --from=frontend-builder /app/frontend/package.json /app/frontend/
COPY --from=frontend-builder /app/frontend/pnpm-lock.yaml /app/frontend/
COPY --from=frontend-builder /app/frontend/next.config.js /app/frontend/

# 安装前端生产依赖
WORKDIR /app/frontend
RUN pnpm install --prod --frozen-lockfile

# 添加启动脚本
WORKDIR /app
COPY start.sh ./
RUN chmod +x start.sh

# 设置环境变量 - 生产环境使用相对路径
ENV NODE_ENV=production
ENV FRONTEND_URL=http://localhost:3000
ENV BACKEND_URL=http://localhost:3001
ENV NEXT_PUBLIC_API_URL=/api

# 暴露端口
EXPOSE 3000
EXPOSE 3001

# 启动服务
CMD ["./start.sh"] 
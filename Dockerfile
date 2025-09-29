# 构建阶段 - 前端
FROM node:18-alpine AS frontend-builder
WORKDIR /app/frontend

# 设置构建时环境变量
ARG NEXT_PUBLIC_API_URL=http://localhost:3001/api
ARG BACKEND_URL=http://localhost:3001
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV BACKEND_URL=$BACKEND_URL

COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# 构建阶段 - 后端
FROM node:18-alpine AS backend-builder
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm install
COPY backend/ ./
RUN npm run build

# 生产阶段
FROM node:18-alpine
WORKDIR /app

# 创建数据目录
RUN mkdir -p /app/data

# 复制后端构建产物
COPY --from=backend-builder /app/backend/dist /app/backend/dist
COPY --from=backend-builder /app/backend/package*.json /app/backend/

# 安装后端生产依赖
WORKDIR /app/backend
RUN npm install --omit=dev

# 复制前端构建产物
COPY --from=frontend-builder /app/frontend/.next /app/frontend/.next
COPY --from=frontend-builder /app/frontend/public /app/frontend/public
COPY --from=frontend-builder /app/frontend/package*.json /app/frontend/
COPY --from=frontend-builder /app/frontend/next.config.js /app/frontend/

# 安装前端生产依赖
WORKDIR /app/frontend
RUN npm install --omit=dev

# 添加启动脚本
WORKDIR /app
COPY start.sh ./
RUN chmod +x start.sh

# 设置环境变量
ENV NODE_ENV=production
ENV FRONTEND_URL=http://localhost:3000
ENV BACKEND_URL=http://localhost:3001
ENV NEXT_PUBLIC_API_URL=http://localhost:3001/api

# 暴露端口
EXPOSE 3000
EXPOSE 3001

# 启动服务
CMD ["./start.sh"] 
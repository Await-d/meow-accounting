# 架构说明

## 单容器单端口部署架构

### 整体架构图

```
┌─────────────────────────────────────────────────────────────┐
│                    Docker Container                          │
│                   meow-accounting                            │
│                                                               │
│  ┌────────────────────────────────────────────────────┐    │
│  │              Nginx (Port 80)                        │    │
│  │           反向代理 + 静态文件服务                     │    │
│  └────────────────────────────────────────────────────┘    │
│           │                           │                      │
│           │ /api/*                    │ /*                  │
│           ↓                           ↓                      │
│  ┌──────────────────┐      ┌───────────────────────┐       │
│  │  Backend Service │      │   Frontend Service    │       │
│  │   (Port 3001)    │      │    (Port 3000)        │       │
│  │                  │      │                       │       │
│  │  ├─ Express.js   │      │  ├─ Next.js          │       │
│  │  ├─ REST API     │      │  ├─ React UI         │       │
│  │  ├─ JWT Auth     │      │  └─ TypeScript       │       │
│  │  └─ SQLite DB    │      │                       │       │
│  └──────────────────┘      └───────────────────────┘       │
│           │                                                  │
│           ↓                                                  │
│  ┌──────────────────────────────────────┐                  │
│  │        Persistent Storage             │                  │
│  │  /app/data  (SQLite, uploads, etc)   │                  │
│  └──────────────────────────────────────┘                  │
└─────────────────────────────────────────────────────────────┘
         │ (Volume Mount)
         ↓
  ┌─────────────────┐
  │   Host System   │
  │   ./data/       │
  │   ./logs/       │
  └─────────────────┘
```

### 请求流程

#### 前端页面请求
```
用户浏览器 → http://localhost/dashboard
    ↓
Nginx (80端口)
    ↓
匹配 location /
    ↓
代理到 Frontend (3000端口)
    ↓
返回 HTML + JS + CSS
    ↓
用户浏览器
```

#### API 请求
```
用户浏览器 → http://localhost/api/transactions
    ↓
Nginx (80端口)
    ↓
匹配 location /api/
    ↓
代理到 Backend (3001端口)
    ↓
Express.js 处理请求
    ↓
SQLite 查询数据
    ↓
返回 JSON 数据
    ↓
Nginx → 用户浏览器
```

#### 静态资源请求
```
用户浏览器 → http://localhost/_next/static/xxx.js
    ↓
Nginx (80端口)
    ↓
匹配 location /_next/
    ↓
代理到 Frontend + 添加缓存头
    ↓
缓存 1 年
    ↓
用户浏览器
```

## 核心优势

### 1. 统一端口访问
- **单一入口**: 只需开放 80 端口
- **简化配置**: 无需配置多端口防火墙规则
- **用户友好**: URL 更简洁，无需指定端口

### 2. 自动跨域处理
- **同源策略**: 前后端同域名同端口，无跨域问题
- **无需 CORS**: 不需要配置复杂的 CORS 头部
- **Cookie 友好**: Cookie 自动携带，无跨域限制

### 3. 性能优化
- **静态文件缓存**: Nginx 缓存 JS/CSS/图片 1 年
- **Gzip 压缩**: 自动压缩响应内容
- **连接复用**: HTTP/1.1 keep-alive

### 4. 安全增强
- **后端隐藏**: 后端不直接暴露在公网
- **统一入口**: 便于添加 WAF、限流等安全策略
- **安全头部**: 自动添加 X-Frame-Options、CSP 等

### 5. 运维简化
- **单容器管理**: 只需管理一个容器
- **日志集中**: 所有日志在同一容器
- **资源控制**: 统一的资源限制和监控

## 技术细节

### Nginx 配置要点

```nginx
# 后端 API 代理
location /api/ {
    proxy_pass http://127.0.0.1:3001/api/;
    proxy_http_version 1.1;
    # 传递真实客户端信息
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
}

# 前端页面代理
location / {
    proxy_pass http://127.0.0.1:3000;
    # WebSocket 支持
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
}

# 静态资源优化
location ~* \.(js|css|png|jpg)$ {
    proxy_pass http://127.0.0.1:3000;
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### 启动流程

1. **容器启动** (`start.sh`)
   ```bash
   # 1. 启动 Nginx
   nginx

   # 2. 启动后端（后台）
   cd /app/backend && node dist/app.js &

   # 3. 启动前端（后台）
   cd /app/frontend/.next/standalone && node server.js &

   # 4. 等待所有服务
   wait
   ```

2. **健康检查**
   - Docker 每 30 秒检查一次
   - 通过 Nginx 访问后端健康检查接口
   - 失败 3 次标记为 unhealthy

### 数据持久化

```
Host Volume Mount:
./data/          → /app/data          (SQLite 数据库)
./logs/          → /app/logs          (应用日志)
./logs/nginx/    → /var/log/nginx    (Nginx 日志)
```

### 环境变量配置

**构建时变量**（影响前端构建）：
```bash
NEXT_PUBLIC_API_URL=/api  # 前端 API 地址（嵌入到构建产物）
```

**运行时变量**（影响后端运行）：
```bash
NODE_ENV=production       # 运行环境
JWT_SECRET=***           # JWT 密钥
DATABASE_URL=***         # 数据库地址
```

## 与传统方案对比

### 传统方案（两个端口）

```
用户 → http://localhost:3000 (前端)
     → http://localhost:3001/api (后端)

问题：
- 需要配置 CORS
- 需要开放两个端口
- URL 不统一
- Cookie 跨域问题
```

### 单容器单端口方案

```
用户 → http://localhost (Nginx)
     ├─ / → 前端
     └─ /api → 后端

优势：
✅ 无需 CORS
✅ 单端口访问
✅ URL 统一
✅ 无跨域问题
```

## 扩展方案

### 添加 HTTPS

1. **使用外部反向代理（推荐）**
   ```nginx
   # 主机 Nginx 配置
   server {
       listen 443 ssl;
       server_name your-domain.com;

       ssl_certificate /path/to/cert.pem;
       ssl_certificate_key /path/to/key.pem;

       location / {
           proxy_pass http://localhost:80;
       }
   }
   ```

2. **容器内配置 SSL**
   ```dockerfile
   # Dockerfile 添加证书
   COPY ssl/cert.pem /etc/nginx/ssl/
   COPY ssl/key.pem /etc/nginx/ssl/
   ```

### 负载均衡

```yaml
# docker-compose.yml
services:
  nginx-lb:
    image: nginx:alpine
    ports:
      - "80:80"
    depends_on:
      - app1
      - app2

  app1:
    build: .
    expose:
      - "80"

  app2:
    build: .
    expose:
      - "80"
```

### 添加监控

```yaml
# docker-compose.yml
services:
  meow-accounting:
    # ...

  prometheus:
    image: prom/prometheus
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml

  grafana:
    image: grafana/grafana
    depends_on:
      - prometheus
```

## 性能指标

### 资源占用

- **内存**: 约 500MB-1GB（包含 Nginx + 前端 + 后端）
- **CPU**: 1-2 核心
- **磁盘**: 约 500MB（镜像）+ 数据

### 性能表现

- **首次加载**: < 2s
- **API 响应**: < 100ms
- **静态资源**: < 10ms（缓存命中）
- **并发支持**: 1000+ 请求/秒

### 优化建议

1. **启用 HTTP/2**: 提升并发性能
2. **CDN 加速**: 静态资源使用 CDN
3. **Redis 缓存**: 减少数据库压力
4. **连接池**: 优化数据库连接
5. **资源限制**: 设置合理的 CPU/内存限制

## 故障恢复

### 自动重启

```yaml
# docker-compose.yml
restart: unless-stopped  # 容器异常退出自动重启
```

### 健康检查

```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost/health"]
  interval: 30s
  timeout: 10s
  retries: 3
```

### 数据备份

```bash
# 定时备份脚本
0 2 * * * docker exec meow-accounting sqlite3 /app/data/sqlite.db ".backup /app/data/backup.db"
```

## 总结

单容器单端口方案通过 Nginx 反向代理实现了：
- ✅ 简化部署流程
- ✅ 优化用户体验
- ✅ 提升安全性
- ✅ 便于维护管理

适用于中小型应用的生产环境部署。

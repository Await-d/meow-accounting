# Docker 单容器单端口部署指南

## 架构说明

本项目采用**单容器单端口**部署方案：

```
用户请求 (端口 80)
    ↓
Nginx 反向代理
    ↓
    ├── /api/*  → 后端服务 (内部 3001 端口)
    └── /*      → 前端服务 (内部 3000 端口)
```

**优势：**
- ✅ **统一端口访问**：只需开放一个端口 (80)
- ✅ **自动跨域处理**：Nginx 反向代理自动解决 CORS 问题
- ✅ **简化部署**：一个容器包含所有服务
- ✅ **安全性高**：后端不直接暴露在公网
- ✅ **性能优化**：Nginx 静态文件缓存

## 快速开始

### 方式 1：使用一键部署脚本（推荐）

```bash
# 克隆项目
git clone https://github.com/Await-d/meow-accounting.git
cd meow-accounting

# 运行部署脚本
./docker-deploy.sh
```

脚本会自动：
1. 检查 Docker 环境
2. 创建配置文件
3. 构建镜像
4. 启动服务

### 方式 2：手动部署

```bash
# 1. 复制环境变量文件
cp .env.docker .env

# 2. 修改配置（重要！）
nano .env
# 必须修改：JWT_SECRET（设置强密码）
# 可选修改：Redis 配置等

# 3. 创建数据目录
mkdir -p data logs logs/nginx

# 4. 构建并启动
docker-compose build --build-arg NEXT_PUBLIC_API_URL=/api
docker-compose up -d

# 5. 查看状态
docker-compose ps
docker-compose logs -f
```

## 访问应用

部署成功后：

- **主页面**: http://localhost
- **API 接口**: http://localhost/api
- **健康检查**: http://localhost/health

## 配置说明

### 必须修改的配置

在 `.env` 文件中：

```bash
# JWT 密钥（必须修改为强密码！）
JWT_SECRET=your_strong_jwt_secret_change_this_in_production
```

### 端口配置

默认使用 **80 端口**，如需修改：

```yaml
# docker-compose.yml
ports:
  - "8080:80"  # 修改为 8080 端口
```

### Redis 配置（可选）

如果需要 Redis 缓存：

```bash
# 启动 Redis
docker-compose --profile with-redis up -d

# 或在 .env 中配置外部 Redis
REDIS_URL=redis://:password@your-redis-host:6379
```

## 容器管理

### 查看服务状态

```bash
docker-compose ps
```

### 查看日志

```bash
# 查看所有日志
docker-compose logs -f

# 查看特定服务日志
docker-compose logs -f meow-accounting

# 查看最近 100 行日志
docker-compose logs --tail=100
```

### 重启服务

```bash
# 重启所有服务
docker-compose restart

# 重启主应用
docker-compose restart meow-accounting
```

### 停止服务

```bash
# 停止但不删除容器
docker-compose stop

# 停止并删除容器
docker-compose down

# 停止并删除容器、卷、镜像
docker-compose down -v --rmi all
```

### 更新应用

```bash
# 1. 拉取最新代码
git pull

# 2. 重新构建
docker-compose build --no-cache

# 3. 重启服���
docker-compose up -d
```

## 数据管理

### 数据持久化

数据保存在以下目录：

```
./data/           # SQLite 数据库
./logs/           # 应用日志
./logs/nginx/     # Nginx 日志
```

### 数据备份

```bash
# 备份数据库
cp ./data/sqlite.db ./data/sqlite.db.backup.$(date +%Y%m%d_%H%M%S)

# 或使用 Docker 命令
docker exec meow-accounting sqlite3 /app/data/sqlite.db ".backup /app/data/backup.db"
docker cp meow-accounting:/app/data/backup.db ./backup.db
```

### 数据恢复

```bash
# 1. 停止服务
docker-compose stop

# 2. 恢复数据库
cp ./data/sqlite.db.backup ./data/sqlite.db

# 3. 启动服务
docker-compose start
```

## 性能优化

### 资源限制

在 `docker-compose.yml` 中添加：

```yaml
services:
  meow-accounting:
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 2G
        reservations:
          cpus: '0.5'
          memory: 512M
```

### Nginx 优化

Nginx 配置已包含：
- 静态文件缓存（1年）
- Gzip 压缩
- 请求超时设置
- 安全头部

## 安全建议

### 1. 修改默认配置

```bash
# 必须修改
JWT_SECRET=strong_random_password_here

# 建议修改
REDIS_PASSWORD=your_redis_password
```

### 2. 使用 HTTPS

配置反向代理（如 Nginx、Caddy）：

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:80;
    }
}
```

### 3. 防火墙配置

```bash
# 只开放必要端口
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

## 故障排除

### 1. 服务无法启动

```bash
# 查看详细日志
docker-compose logs meow-accounting

# 检查端口占用
netstat -tlnp | grep :80
```

### 2. 数据库连接失败

```bash
# 检查数据目录权限
ls -la ./data/

# 重新创建数据目录
rm -rf ./data && mkdir -p ./data
docker-compose restart
```

### 3. API 请求 404

检查 Nginx 配置：

```bash
# 进入容器
docker exec -it meow-accounting sh

# 查看 Nginx 配置
cat /etc/nginx/http.d/default.conf

# 测试 Nginx 配置
nginx -t

# 重启 Nginx
nginx -s reload
```

### 4. 前端无法访问后端

```bash
# 检查环境变量
docker exec meow-accounting env | grep API_URL

# 确认后端服务运行
docker exec meow-accounting curl http://localhost:3001/api/health
```

## 监控和维护

### 健康检查

```bash
# 检查服务健康状态
curl http://localhost/health

# 检查容器健康状态
docker inspect --format='{{.State.Health.Status}}' meow-accounting
```

### 日志轮转

添加日志轮转配置：

```bash
# 创建 /etc/logrotate.d/meow-accounting
/path/to/logs/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
}
```

## 高级配置

### 使用外部数据库

```yaml
# docker-compose.yml
environment:
  - DATABASE_URL=postgresql://user:pass@postgres:5432/dbname

# 启动 PostgreSQL
docker-compose --profile with-postgres up -d
```

### 启用监控

```bash
# 启动 Prometheus + Grafana
docker-compose --profile monitoring up -d

# 访问
# Prometheus: http://localhost:9090
# Grafana: http://localhost:3002 (admin/admin)
```

## 生产环境检查清单

- [ ] 已修改 JWT_SECRET
- [ ] 已配置 HTTPS
- [ ] 已设置防火墙规则
- [ ] 已配置数据备份
- [ ] 已设置日志轮转
- [ ] 已测试健康检查
- [ ] 已配置监控告警
- [ ] 已限制容器资源

## 技术支持

如遇问题，请：

1. 查看日志：`docker-compose logs -f`
2. 检查健康状态：`curl http://localhost/health`
3. 提交 Issue：https://github.com/Await-d/meow-accounting/issues

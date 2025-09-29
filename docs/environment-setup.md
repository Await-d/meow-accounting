# 环境配置指南

本文档说明如何为不同环境配置喵呜记账应用。

## 环境文件说明

项目包含以下环境配置文件：

- `.env.example` - 环境变量模板
- `.env.development` - 开发环境配置
- `.env.production` - 生产环境配置
- `.env.test` - 测试环境配置
- `.env.docker` - Docker环境配置

## 快速开始

### 1. 开发环境

```bash
# 复制开发环境配置
cp .env.development .env

# 或者从模板创建
cp .env.example .env
# 然后编辑 .env 文件
```

### 2. 生产环境

```bash
# 复制生产环境配置
cp .env.production .env

# ⚠️ 重要：必须修改以下配置
# - JWT_SECRET: 使用强密码
# - FRONTEND_URL/BACKEND_URL: 替换为实际域名
# - 数据库连接信息
```

### 3. Docker环境

```bash
# 复制Docker环境配置
cp .env.docker .env

# 或者直接使用docker-compose
docker-compose --env-file .env.docker up -d
```

## 环境变量详解

### 基础配置

| 变量名 | 说明 | 默认值 | 必填 |
|--------|------|--------|------|
| `NODE_ENV` | 运行环境 | `development` | ✅ |
| `FRONTEND_PORT` | 前端端口 | `3000` | ✅ |
| `BACKEND_PORT` | 后端端口 | `3001` | ✅ |
| `FRONTEND_URL` | 前端URL | `http://localhost:3000` | ✅ |
| `BACKEND_URL` | 后端URL | `http://localhost:3001` | ✅ |

### 数据库配置

| 变量名 | 说明 | 示例 | 必填 |
|--------|------|------|------|
| `DATABASE_URL` | 数据库连接字符串 | `file:./data/sqlite.db` | ✅ |

支持的数据库类型：
- SQLite: `file:./data/sqlite.db`
- PostgreSQL: `postgresql://user:pass@host:5432/db`
- MySQL: `mysql://user:pass@host:3306/db`

### 安全配置

| 变量名 | 说明 | 示例 | 必填 |
|--------|------|------|------|
| `JWT_SECRET` | JWT签名密钥 | `your_strong_secret_key` | ✅ |
| `JWT_EXPIRES_IN` | JWT过期时间 | `24h` | ❌ |

⚠️ **安全提醒**：
- 生产环境必须使用强的 `JWT_SECRET`
- 建议使用至少32个字符的随机字符串
- 可以使用以下命令生成：`openssl rand -base64 32`

### 缓存配置

| 变量名 | 说明 | 示例 | 必填 |
|--------|------|------|------|
| `REDIS_URL` | Redis连接URL | `redis://localhost:6379` | ❌ |
| `REDIS_PASSWORD` | Redis密码 | `your_redis_password` | ❌ |

### 日志配置

| 变量名 | 说明 | 可选值 | 默认值 |
|--------|------|--------|--------|
| `LOG_LEVEL` | 日志级别 | `error`, `warn`, `info`, `debug` | `info` |

### 开发工具配置

| 变量名 | 说明 | 可选值 | 默认值 |
|--------|------|--------|--------|
| `ENABLE_SWAGGER` | 启用API文档 | `true`, `false` | `false` |
| `ENABLE_CORS` | 启用跨域 | `true`, `false` | `false` |
| `CORS_ORIGIN` | 允许的域名 | `https://example.com` | `*` |

### 监控配置

| 变量名 | 说明 | 示例 | 必填 |
|--------|------|------|------|
| `SENTRY_DSN` | Sentry错误监控 | `https://xxx@sentry.io/xxx` | ❌ |
| `PROMETHEUS_ENABLED` | 启用Prometheus监控 | `true`, `false` | ❌ |

## 环境特定说明

### 开发环境特点

- 启用详细日志 (`LOG_LEVEL=debug`)
- 启用API文档 (`ENABLE_SWAGGER=true`)
- 启用跨域请求 (`ENABLE_CORS=true`)
- 使用本地SQLite数据库

### 生产环境特点

- 最小日志级别 (`LOG_LEVEL=info`)
- 禁用API文档 (`ENABLE_SWAGGER=false`)
- 严格的CORS配置
- 推荐使用Redis缓存
- 启用监控和错误追踪

### 测试环境特点

- 使用内存数据库 (`DATABASE_URL=:memory:`)
- 错误级别日志 (`LOG_LEVEL=error`)
- 较短的JWT过期时间
- 独立的端口配置

### Docker环境特点

- 使用Docker网络内的服务名
- 数据持久化到挂载卷
- 健康检查配置
- 容器间服务发现

## 常见问题

### Q: 如何生成安全的JWT密钥？

```bash
# 方法1：使用OpenSSL
openssl rand -base64 32

# 方法2：使用Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# 方法3：在线生成器
# 访问 https://www.allkeysgenerator.com/Random/Security-Encryption-Key-Generator.aspx
```

### Q: 如何配置多环境部署？

```bash
# 开发环境
NODE_ENV=development npm start

# 生产环境
NODE_ENV=production npm start

# 测试环境
NODE_ENV=test npm test
```

### Q: Docker Compose如何使用不同的环境文件？

```bash
# 使用特定环境文件
docker-compose --env-file .env.production up -d

# 或者在docker-compose.yml中指定
version: '3.8'
services:
  app:
    env_file:
      - .env.production
```

### Q: 如何在Kubernetes中管理环境变量？

```yaml
# 创建ConfigMap
apiVersion: v1
kind: ConfigMap
metadata:
  name: meow-config
data:
  NODE_ENV: production
  LOG_LEVEL: info

# 创建Secret
apiVersion: v1
kind: Secret
metadata:
  name: meow-secrets
data:
  JWT_SECRET: <base64-encoded-secret>
```

### Q: 如何验证环境配置？

```bash
# 检查环境变量
npm run config:check

# 或者手动检查
node -e "
require('dotenv').config();
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('DATABASE_URL:', process.env.DATABASE_URL);
console.log('JWT_SECRET set:', !!process.env.JWT_SECRET);
"
```

## 最佳实践

1. **安全性**
   - 永远不要提交包含敏感信息的 `.env` 文件
   - 生产环境使用强密码和密钥
   - 定期轮换密钥

2. **可维护性**
   - 为每个环境使用单独的配置文件
   - 在代码中使用默认值
   - 添加配置验证

3. **部署**
   - 使用CI/CD管道管理环境变量
   - 在部署前验证配置
   - 使用密钥管理服务

4. **监控**
   - 配置日志聚合
   - 设置错误监控
   - 启用性能监控

## 故障排除

### 常见错误及解决方案

1. **数据库连接失败**
   ```
   错误：Database connection failed
   解决：检查DATABASE_URL格式和数据库服务状态
   ```

2. **JWT验证失败**
   ```
   错误：Invalid JWT token
   解决：确保JWT_SECRET配置正确且一致
   ```

3. **端口冲突**
   ```
   错误：Port 3000 already in use
   解决：修改FRONTEND_PORT或停止占用端口的服务
   ```

4. **CORS错误**
   ```
   错误：CORS policy error
   解决：检查CORS_ORIGIN配置或设置ENABLE_CORS=true
   ```

## 联系支持

如果遇到配置问题，请：

1. 查看 [故障排除指南](./troubleshooting.md)
2. 检查 [常见问题](./faq.md)
3. 在GitHub创建Issue
4. 联系技术支持
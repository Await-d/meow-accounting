# 喵呜记账

一个功能强大的路由管理系统，支持路由优化、性能监控和自定义设置。

## 功能特性

### 路由分析
- 路由访问分布可视化（饼图）
- 路由加载时间趋势分析（折线图）
- 错误率统计和监控
- 实时性能报告

### 性能监控
- 路由加载时间追踪
- 错误率监控
- 缓存命中率统计
- 预热状态跟踪
- 详细的性能报告生成

### 自定义设置
- 主题切换（浅色/深色/系统）
- 语言选择
- 外观设置（字体大小、动画速度、布局密度）
- 性能设置（预加载、缓存大小、动画效果）
- 通知设置（邮件、推送、桌面通知）

### 路由参数持久化
- 自动保存路由参数
- 参数恢复功能
- 参数验证
- 清除参数功能

## 技术栈

### 前端
- React + Next.js
- TypeScript
- NextUI 组件库
- Recharts 图表库
- Local Storage 持久化存储

### 后端
- Node.js
- Express
- SQLite/PostgreSQL
- JWT 认证
- RESTful API

### 部署
- Docker 容器化
- GitHub Actions CI/CD
- 多架构支持 (amd64/arm64)

## 快速开始

### Docker 部署（推荐）

#### 1. 使用预构建镜像

```bash
# 拉取最新镜像
docker pull await2719/meow-accounting:latest

# 运行容器
docker run -d \
  --name meow-accounting \
  -p 3000:3000 \
  -p 3001:3001 \
  -v $(pwd)/data:/app/data \
  # 如需启用Redis缓存，可为容器提供可访问的Redis地址
  # -e REDIS_URL=redis://host.docker.internal:6379 \
  -e JWT_SECRET=your_strong_jwt_secret \
  await2719/meow-accounting:latest
```

#### 2. 使用 Docker Compose

创建 `docker-compose.yml` 文件：

```yaml
version: '3.8'

services:
  meow-accounting:
    image: await2719/meow-accounting:latest
    container_name: meow-accounting
    depends_on:
      - redis
    ports:
      - "3000:3000"  # 前端端口
      - "3001:3001"  # 后端API端口
    volumes:
      - ./data:/app/data  # 数据持久化
      - ./logs:/app/logs  # 日志目录
    environment:
      - NODE_ENV=production
      - JWT_SECRET=your_strong_jwt_secret_change_this
      - DATABASE_URL=file:/app/data/sqlite.db
      - REDIS_URL=redis://redis:6379
      - LOG_LEVEL=info
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  redis:
    image: redis:7-alpine
    container_name: meow-accounting-redis
    ports:
      - "6379:6379"
    volumes:
      - ./redis-data:/data
    command: ["redis-server", "--save", "60", "1"]
```

启动服务：

```bash
# 启动服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

#### 3. 环境变量配置

| 变量名 | 默认值 | 说明 |
|--------|--------|------|
| `NODE_ENV` | `production` | 运行环境 |
| `FRONTEND_PORT` | `3000` | 前端服务端口 |
| `BACKEND_PORT` | `3001` | 后端API端口 |
| `DATABASE_URL` | `file:/app/data/sqlite.db` | 数据库连接地址 |
| `JWT_SECRET` | - | JWT密钥（必须设置） |
| `JWT_EXPIRES_IN` | `24h` | JWT过期时间 |
| `LOG_LEVEL` | `info` | 日志级别 |
| `REDIS_URL` | - | Redis连接地址（启用缓存时设置） |
| `REDIS_PASSWORD` | - | Redis密码（如实例启用认证） |

### 本地开发

#### 1. 安装依赖

```bash
# 安装前端依赖
cd frontend
npm install

# 安装后端依赖
cd ../backend
npm install
```

#### 2. 配置环境变量

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑配置文件
vim .env
```

#### 3. 启动开发服务

```bash
# 启动后端服务
cd backend
npm run dev

# 启动前端服务（新终端）
cd frontend
npm run dev
```

### 访问应用

- **前端界面**: http://localhost:3000
- **后端API**: http://localhost:3001/api
- **API文档**: http://localhost:3001/api/docs

## 功能使用

### 路由分析
```tsx
import { RouteAnalytics } from '@/components/RouteAnalytics';

function Dashboard() {
    return <RouteAnalytics />;
}
```

### 性能监控
```tsx
import { useRouteMonitor } from '@/hooks/useRouteMonitor';

function App() {
    const { getPerformanceReport } = useRouteMonitor();
    // 使用性能报告数据
}
```

### 自定义设置
```tsx
import { CustomSettings } from '@/components/CustomSettings';

function SettingsPage() {
    return <CustomSettings />;
}
```

### 路由参数持久化
```tsx
import { useRouteParams } from '@/hooks/useRouteParams';

function Component() {
    const { saveParams, getParams, clearParams } = useRouteParams();
    // 管理路由参数
}
```

## 配置选项

### 性能监控配置
- 加载时间阈值
- 错误率警告阈值
- 缓存大小限制
- 预热超时设置

### 自定义设置选项
- 主题：light/dark/system
- 语言：zh-CN/en-US
- 字体大小：12-24px
- 动画速度：0-500ms
- 布局密度：comfortable/compact/spacious
- 缓存大小：0-200MB

## API 文档

### 认证接口

```bash
# 用户登录
POST /api/auth/login
Content-Type: application/json
{
  "username": "admin",
  "password": "password"
}

# 用户注册
POST /api/auth/register
Content-Type: application/json
{
  "username": "newuser",
  "password": "password",
  "email": "user@example.com"
}

# 刷新Token
POST /api/auth/refresh
Authorization: Bearer <token>
```

### 路由管理

```bash
# 获取路由列表
GET /api/routes

# 创建路由
POST /api/routes
{
  "path": "/api/users",
  "method": "GET",
  "description": "获取用户列表"
}

# 更新路由
PUT /api/routes/:id
{
  "description": "更新的描述"
}

# 删除路由
DELETE /api/routes/:id
```

### 性能监控

```bash
# 获取性能报告
GET /api/performance/report

# 获取路由统计
GET /api/performance/stats

# 记录路由访问
POST /api/performance/track
{
  "route": "/api/users",
  "method": "GET",
  "responseTime": 120,
  "statusCode": 200
}
```

## 数据备份与恢复

### 数据备份

```bash
# 备份数据库
docker exec meow-accounting sqlite3 /app/data/sqlite.db ".backup /app/data/backup.db"

# 复制备份文件到主机
docker cp meow-accounting:/app/data/backup.db ./backup.db
```

### 数据恢复

```bash
# 停止服务
docker-compose down

# 恢复数据库
cp backup.db ./data/sqlite.db

# 重启服务
docker-compose up -d
```

## 故障排除

### 常见问题

1. **容器启动失败**
   ```bash
   # 查看容器日志
   docker logs meow-accounting

   # 检查端口占用
   netstat -tlnp | grep :3000
   ```

2. **数据库连接失败**
   ```bash
   # 检查数据目录权限
   ls -la ./data/

   # 重新创建数据目录
   mkdir -p ./data && chmod 755 ./data
   ```

3. **JWT认证失败**
   ```bash
   # 检查JWT_SECRET是否设置
   docker exec meow-accounting env | grep JWT_SECRET
   ```

### 性能优化

1. **数据库优化**
   - 定期清理日志数据
   - 添加合适的索引
   - 使用PostgreSQL替代SQLite（生产环境）

2. **容器优化**
   - 限制内存使用：`--memory=512m`
   - 设置CPU限制：`--cpus=1.0`
   - 使用健康检查监控服务状态

## 开发计划

- [x] 基础路由管理
- [x] 路由分析图表
- [x] 性能监控系统
- [x] 自定义设置
- [x] 参数持久化
- [x] Docker容器化部署
- [x] CI/CD自动化流程
- [ ] 路由预测系统
- [ ] 性能优化建议
- [ ] 更多数据可视化
- [ ] 导出分析报告
- [ ] 微服务架构支持
- [ ] 集群部署方案

## 贡献指南

1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 许可证

本项目基于 MIT 许可证开源 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 支持

如果您在使用过程中遇到问题，请：

1. 查看 [常见问题](#故障排除)
2. 搜索现有的 [Issues](https://github.com/Await-d/meow-accounting/issues)
3. 创建新的 Issue 描述问题
4. 联系维护者获取支持

## 更新日志

查看 [Releases](https://github.com/Await-d/meow-accounting/releases) 页面了解版本更新详情。 
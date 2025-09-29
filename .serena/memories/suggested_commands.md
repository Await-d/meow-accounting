# 喵呜记账推荐命令

## 开发相关命令

### 后端开发命令

```bash
# 进入后端目录
cd backend

# 安装依赖
pnpm install

# 启动开发服务器（自动重载）
pnpm run dev

# 构建项目
pnpm run build

# 运行生产版本
pnpm start

# 运行测试
pnpm test
```

### 前端开发命令

```bash
# 进入前端目录
cd frontend

# 安装依赖
pnpm install

# 启动开发服务器
pnpm run dev

# 构建项目
pnpm run build

# 运行生产版本
pnpm start

# 运行代码检查
pnpm run lint
```

## Docker 相关命令

```bash
# 构建Docker镜像
docker build -t meow-accounting .

# 运行Docker容器
docker run -p 3000:3000 -p 3001:3001 -v ./data:/app/data -d meow-accounting

# 查看容器日志
docker logs <container_id>
```

## 数据库操作命令

```bash
# 生成数据库表（初始化）
node dist/models/init-db.js

# 备份SQLite数据库
cp data/sqlite.db data/sqlite.db.bak
```

## Git 相关命令

```bash
# 克隆项目
git clone <repository_url>

# 提交更改
git add .
git commit -m "类型: 更改描述"
git push

# 拉取最新代码
git pull
```

## 系统工具命令

```bash
# 查看进程
ps aux | grep node

# 查看端口占用
netstat -tulpn | grep LISTEN

# 停止占用端口的进程
kill -9 $(lsof -t -i:3000)
kill -9 $(lsof -t -i:3001)
```

## 测试API的命令

```bash
# 使用curl测试API
curl -X GET http://localhost:3001/api/transactions -H "Authorization: Bearer <token>"

# 使用curl创建用户
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@example.com","password":"password123"}'
```
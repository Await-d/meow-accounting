# 快速开始 - 5 分钟部署指南

## 🚀 一键部署（最简单）

```bash
git clone https://github.com/Await-d/meow-accounting.git
cd meow-accounting
./docker-deploy.sh
```

**就这么简单！** 🎉

访问: http://localhost

---

## 📋 手动部署（3 步）

### 1️⃣ 准备配置
```bash
cp .env.docker .env
nano .env  # 修改 JWT_SECRET
```

### 2️⃣ 构建启动
```bash
docker-compose build --build-arg NEXT_PUBLIC_API_URL=/api
docker-compose up -d
```

### 3️⃣ 验证运行
```bash
docker-compose ps
curl http://localhost/health
```

---

## 🎯 关键信息

| 项目 | 信息 |
|------|------|
| 访问地址 | http://localhost |
| API 地址 | http://localhost/api |
| 健康检查 | http://localhost/health |
| 端口 | 只需 80 |
| 数据目录 | ./data/ |
| 日志目录 | ./logs/ |

---

## 🔧 常用命令

```bash
# 查看日志
docker-compose logs -f

# 重启服务
docker-compose restart

# 停止服务
docker-compose down

# 更新应用
git pull && docker-compose build --no-cache && docker-compose up -d

# 备份数据
cp ./data/sqlite.db ./data/backup.db
```

---

## ⚡ 核心特性

✅ **单容器单端口** - 一个容器包含所有服务
✅ **自动跨域处理** - Nginx 反向代理
✅ **简化部署** - 无需复杂配置
✅ **生产就绪** - 包含监控、日志、健康检查

---

## 🔒 安全检查清单

- [ ] 修改 `.env` 中的 `JWT_SECRET`
- [ ] 配置防火墙（只开放 80/443）
- [ ] 启用 HTTPS（生产环境）
- [ ] 定期备份数据

---

## 📚 详细文档

- **完整部署指南**: [DOCKER_DEPLOY.md](./DOCKER_DEPLOY.md)
- **架构说明**: [ARCHITECTURE.md](./ARCHITECTURE.md)
- **项目文档**: [README.md](./README.md)

---

## 💡 故障排除

### 服务无法启动？
```bash
docker-compose logs meow-accounting
```

### 端口被占用？
```bash
# 修改端口
# docker-compose.yml 中改为 "8080:80"
```

### 数据库错误？
```bash
rm -rf ./data && mkdir -p ./data
docker-compose restart
```

---

## 🆘 需要帮助？

- 📖 查看文档: [DOCKER_DEPLOY.md](./DOCKER_DEPLOY.md)
- 🐛 报告问题: https://github.com/Await-d/meow-accounting/issues
- 💬 讨���交流: GitHub Discussions

---

**🎊 祝使用愉快！**

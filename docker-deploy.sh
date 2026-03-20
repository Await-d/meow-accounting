#!/bin/bash
###
 # @Author: Await
 # @Date: 2025-11-08
 # @Description: Docker一键部署脚本 - 单容器单端口部署
###

set -e

echo "🚀 喵呜记账 - Docker 一键部署脚本"
echo "=================================="
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查Docker是否安装
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ 错误: 未检测到 Docker，请先安装 Docker${NC}"
    exit 1
fi

# 检查Docker Compose是否安装
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo -e "${RED}❌ 错误: 未检测到 Docker Compose，请先安装 Docker Compose${NC}"
    exit 1
fi

# 检查.env文件
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  未找到 .env 文件，从 .env.docker 创建...${NC}"
    cp .env.docker .env
    echo -e "${GREEN}✅ .env 文件已创建${NC}"
    echo -e "${YELLOW}⚠️  请修改 .env 文件中的 JWT_SECRET 等敏感配置${NC}"
    echo ""
    read -p "是否现在编辑 .env 文件? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        ${EDITOR:-nano} .env
    fi
fi

# 创建必要的目录
echo "📁 创建数据目录..."
mkdir -p data logs logs/nginx

# 停止现有容器
echo "🛑 停止现有容器..."
docker-compose down 2>/dev/null || true

# 构建镜像
echo "🔨 构建 Docker 镜像..."
echo "   这可能需要几分钟时间，请耐心等待..."
docker-compose build --build-arg NEXT_PUBLIC_API_URL=/api

# 启动服务
echo "🚀 启动服务..."
docker-compose up -d

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 10

# 检查服务状态
echo ""
echo "🔍 检查服务状态..."
if docker-compose ps | grep -q "Up"; then
    echo -e "${GREEN}✅ 服务启动成功！${NC}"
    echo ""
    echo "📊 服务信息:"
    docker-compose ps
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "${GREEN}🎉 部署完成！${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "📡 访问地址:"
    echo -e "   主页面: ${GREEN}http://localhost${NC}"
    echo -e "   健康检查: ${GREEN}http://localhost/health${NC}"
    echo ""
    echo "📝 常用命令:"
    echo "   查看日志: docker-compose logs -f"
    echo "   停止服务: docker-compose down"
    echo "   重启服务: docker-compose restart"
    echo ""
    echo "💾 数据目录:"
    echo "   数据库: ./data/sqlite.db"
    echo "   日志: ./logs/"
    echo ""
else
    echo -e "${RED}❌ 服务启动失败，请查看日志${NC}"
    echo "查看日志: docker-compose logs"
    exit 1
fi

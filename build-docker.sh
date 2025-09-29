#!/bin/bash

echo "🐳 Docker环境构建和部署脚本"
echo "==============================="

# 设置默认值
NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL:-/api}
BACKEND_URL=${BACKEND_URL:-http://localhost:3001}

echo "📋 当前配置："
echo "NEXT_PUBLIC_API_URL = $NEXT_PUBLIC_API_URL"
echo "BACKEND_URL = $BACKEND_URL"
echo ""

echo "🔧 选择部署方案："
echo "1) 使用Nginx反向代理 (推荐)"
echo "2) 直接暴露端口 (需要输入服务器IP)"
echo "3) 使用当前配置"
read -p "请选择 (1-3): " choice

case $choice in
    1)
        export NEXT_PUBLIC_API_URL="/api"
        echo "✅ 设置API地址为: /api (Nginx代理)"
        ;;
    2)
        read -p "请输入服务器IP地址: " server_ip
        if [ -z "$server_ip" ]; then
            echo "❌ 服务器IP不能为空"
            exit 1
        fi
        export NEXT_PUBLIC_API_URL="http://$server_ip:3001/api"
        echo "✅ 设置API地址为: http://$server_ip:3001/api"
        ;;
    3)
        echo "✅ 使用当前配置: $NEXT_PUBLIC_API_URL"
        ;;
    *)
        echo "❌ 无效选择"
        exit 1
        ;;
esac

echo ""
echo "🚀 开始构建Docker镜像..."
echo "构建参数："
echo "  - NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL"
echo "  - BACKEND_URL=$BACKEND_URL"

# 构建镜像
docker-compose build --build-arg NEXT_PUBLIC_API_URL="$NEXT_PUBLIC_API_URL" --build-arg BACKEND_URL="$BACKEND_URL"

if [ $? -eq 0 ]; then
    echo "✅ Docker镜像构建成功！"
    echo ""
    echo "🚀 启动服务..."
    docker-compose up -d

    if [ $? -eq 0 ]; then
        echo "✅ 服务启动成功！"
        echo ""
        echo "📋 访问信息："
        echo "前端: http://localhost (Nginx代理)"
        echo "API: http://localhost/api"
        echo "后端健康检查: http://localhost/api/health"
        echo ""
        echo "📊 查看日志: docker-compose logs -f"
        echo "🛑 停止服务: docker-compose down"
    else
        echo "❌ 服务启动失败！"
        exit 1
    fi
else
    echo "❌ Docker镜像构建失败！"
    exit 1
fi
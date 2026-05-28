#!/bin/bash
set -e

echo "🚀 智慧餐饮平台 - 一键部署"
echo "=========================="

# 检查 Docker
if ! command -v docker &> /dev/null; then
    echo "❌ 需要安装 Docker: curl -fsSL https://get.docker.com | bash"
    exit 1
fi

if ! docker compose version &> /dev/null 2>&1 && ! docker-compose version &> /dev/null 2>&1; then
    echo "❌ 需要 Docker Compose"
    exit 1
fi

COMPOSE="docker compose"
if ! docker compose version &> /dev/null 2>&1; then
    COMPOSE="docker-compose"
fi

# 拉取构建
echo "📦 构建镜像..."
$COMPOSE build --no-cache

echo "🚀 启动服务..."
$COMPOSE up -d

# 等待启动
echo "⏳ 等待服务就绪..."
sleep 5

# 健康检查
if curl -sf http://localhost/api/meta/brands > /dev/null 2>&1; then
    IP=$(curl -s ifconfig.me 2>/dev/null || echo "服务器IP")
    echo ""
    echo "✅ 部署成功!"
    echo "   访问地址: http://${IP}"
    echo ""
    echo "   测试账号: admin / Admin@123"
    echo ""
    echo "   查看日志: $COMPOSE logs -f"
    echo "   停止服务: $COMPOSE down"
else
    echo "❌ 后端未就绪，查看日志: $COMPOSE logs backend"
fi

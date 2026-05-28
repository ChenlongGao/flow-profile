#!/bin/bash
# ==========================================
# 客流诊断预警系统 - 一键部署脚本
# 在腾讯云 CVM 上运行此脚本
# ==========================================
set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}=========================================="
echo "  客流诊断预警系统 - 部署脚本"
echo "  目标：单台 CVM (建议 4C8G, CentOS 7+/Ubuntu 20.04+)"
echo -e "==========================================${NC}"

# ═══ 1. 环境检查 ═══
echo -e "\n${YELLOW}[1/6] 检查环境...${NC}"

if ! command -v docker &> /dev/null; then
    echo -e "${RED}Docker 未安装，请先安装 Docker${NC}"
    echo "  curl -fsSL https://get.docker.com | sh"
    exit 1
fi

if ! docker compose version &> /dev/null && ! docker-compose --version &> /dev/null; then
    echo -e "${RED}Docker Compose 未安装${NC}"
    echo "  sudo apt install docker-compose-plugin  (Ubuntu)"
    echo "  sudo yum install docker-compose-plugin  (CentOS)"
    exit 1
fi

DOCKER_COMPOSE=$(docker compose version &> /dev/null && echo "docker compose" || echo "docker-compose")

# ═══ 2. 配置检查 ═══
echo -e "\n${YELLOW}[2/6] 检查配置文件...${NC}"

if [ ! -f .env ]; then
    cp .env.example .env 2>/dev/null || true
    echo -e "${YELLOW}请编辑 deploy/.env 文件，填入服务器 IP 和密码${NC}"
fi

# 生成随机 SECRET_KEY
if grep -q "change-this" .env 2>/dev/null; then
    NEW_SECRET=$(openssl rand -hex 32 2>/dev/null || python3 -c "import secrets; print(secrets.token_hex(32))")
    sed -i "s/change-this-to-a-random-string-in-production/$NEW_SECRET/" .env
    echo -e "${GREEN}已生成随机 APP_SECRET_KEY${NC}"
fi

# ═══ 3. 构建前端 ═══
echo -e "\n${YELLOW}[3/6] 构建前端...${NC}"

cd ..
if [ -f package.json ]; then
    npm install --silent
    npm run build
    mkdir -p deploy/dist
    cp -r dist/* deploy/dist/
    echo -e "${GREEN}前端构建完成 → deploy/dist/${NC}"
else
    echo -e "${YELLOW}未找到 package.json，跳过前端构建${NC}"
fi
cd deploy

# ═══ 4. 创建必要目录 ═══
echo -e "\n${YELLOW}[4/6] 创建数据目录...${NC}"
mkdir -p nginx/logs data

# ═══ 5. 启动服务 ═══
echo -e "\n${YELLOW}[5/6] 启动 Docker 服务...${NC}"

$DOCKER_COMPOSE down --remove-orphans 2>/dev/null || true
$DOCKER_COMPOSE up -d --build

echo -e "\n${GREEN}等待服务启动...${NC}"
sleep 10

# ═══ 6. 健康检查 ═══
echo -e "\n${YELLOW}[6/6] 健康检查...${NC}"

# 检查各容器状态
for svc in mysql redis backend nginx; do
    status=$($DOCKER_COMPOSE ps -q $svc 2>/dev/null)
    if [ -n "$status" ]; then
        echo -e "  ${GREEN}✓${NC} $svc 运行中"
    else
        echo -e "  ${RED}✗${NC} $svc 未启动"
    fi
done

# API 健康检查
sleep 3
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/api/health 2>/dev/null || echo "000")
if [ "$HTTP_CODE" = "200" ]; then
    echo -e "\n${GREEN}✓ API 健康检查通过${NC}"
    curl -s http://localhost/api/health | python3 -m json.tool 2>/dev/null || true
else
    echo -e "\n${YELLOW}⚠ API 尚未就绪 (HTTP $HTTP_CODE)，请稍候重试${NC}"
    echo "  查看日志: $DOCKER_COMPOSE logs backend"
fi

# ═══ 完成 ═══
SERVER_IP=$(curl -s ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}')
echo -e "\n${GREEN}=========================================="
echo "  部署完成！"
echo "==========================================${NC}"
echo ""
echo "  访问地址："
echo "    系统首页:  http://${SERVER_IP}/flow-profile/"
echo "    API 文档:  http://${SERVER_IP}/api/docs"
echo "    健康检查:  http://${SERVER_IP}/api/health"
echo ""
echo "  常用命令："
echo "    查看日志:  $DOCKER_COMPOSE logs -f [服务名]"
echo "    重启服务:  $DOCKER_COMPOSE restart"
echo "    停止服务:  $DOCKER_COMPOSE down"
echo "    导入数据:  $DOCKER_COMPOSE exec backend python init_db.py"
echo ""

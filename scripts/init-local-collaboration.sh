#!/bin/bash
# scripts/init-local-collaboration.sh
# 简化版：启动本地开发环境

set -e

echo "🚀 启动本地开发环境"
echo "===================="
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

# 检查 Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker 未安装${NC}"
    exit 1
fi

# 检查 docker-compose
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ docker-compose 未安装${NC}"
    exit 1
fi

# 1. 启动 Docker 容器
echo "🐳 启动 Docker 容器..."
docker-compose up -d

# 2. 等待数据库就绪
echo "⏳ 等待数据库启动..."
sleep 10

# 3. 检查数据库连接
if docker exec aideas-db pg_isready -U user -d aideas_db > /dev/null 2>&1; then
    echo -e "${GREEN}✅ 数据库连接成功${NC}"
else
    echo -e "${RED}❌ 数据库连接失败${NC}"
    exit 1
fi

# 4. 显示访问信息
echo ""
echo "===================="
echo -e "${GREEN}✅ 环境启动完成！${NC}"
echo "===================="
echo ""
echo "📍 访问地址："
echo "   前端：http://localhost:5173"
echo "   后端：http://localhost:8000"
echo "   API 文档：http://localhost:8000/docs"
echo ""
echo "📝 首次使用："
echo "   1. 访问前端注册/登录"
echo "   2. 创建项目时选择团队成员"
echo ""
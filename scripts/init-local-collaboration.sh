#!/bin/bash
# scripts/init-local-collaboration.sh
# 本地协作测试环境一键初始化

set -e

echo "初始化本地协作测试环境"
echo "=========================="
echo ""

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 检查 Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Docker 未安装，请先安装 Docker${NC}"
    exit 1
fi

# 检查 docker-compose
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}docker-compose 未安装，请先安装 docker-compose${NC}"
    exit 1
fi

echo -e "${GREEN}Docker 和 docker-compose 已安装${NC}"
echo ""

# 1. 启动 Docker 容器
echo "启动 Docker 容器..."
docker-compose up -d

# 2. 等待数据库就绪
echo "等待数据库启动..."
sleep 10

# 3. 检查数据库连接
echo "检查数据库连接..."
if docker exec aideas-db pg_isready -U user -d aideas_db > /dev/null 2>&1; then
    echo -e "${GREEN} 数据库连接成功${NC}"
else
    echo -e "${RED} 数据库连接失败${NC}"
    exit 1
fi
echo ""

# 4. 运行数据库迁移
echo "运行数据库迁移..."
if [ -f "backend/scripts/migrations/001_add_project_members.sql" ]; then
    docker exec -i aideas-db psql -U user -d aideas_db < backend/scripts/migrations/001_add_project_members.sql
    echo -e "${GREEN} 数据库迁移完成${NC}"
else
    echo -e "${YELLOW} 迁移文件不存在，跳过${NC}"
fi
echo ""

# 5. 创建测试用户
echo "创建测试用户..."
docker exec -it heuraideas-proto-v1-backend-1 python scripts/create_test_users.py
echo ""

# 6. 导入项目模板（如果还没有模板）
echo "检查模板数据..."
TEMPLATE_COUNT=$(docker exec aideas-db psql -U user -d aideas_db -t -c "SELECT COUNT(*) FROM project_templates;")
if [ "$TEMPLATE_COUNT" -eq 0 ]; then
    echo "没有模板，导入模板数据..."
    docker exec -it heuraideas-proto-v1-backend-1 python scripts/import_template.py
else
    echo -e "${GREEN} 已有 $TEMPLATE_COUNT 个模板${NC}"
fi
echo ""

# 7. 检查项目数据
echo "检查项目数据..."
PROJECT_COUNT=$(docker exec aideas-db psql -U user -d aideas_db -t -c "SELECT COUNT(*) FROM projects;")
if [ "$PROJECT_COUNT" -eq 0 ]; then
    echo ""
    echo -e "${YELLOW} 没有项目${NC}"
    echo ""
    echo "请通过前端创建项目（确保 Steps/Substeps/Subtasks 完整）："
    echo "   1. 打开 http://localhost:5173"
    echo "   2. 登录 Alice (alice@test.com / 123456)"
    echo "   3. 点击 'Create new project'"
    echo "   4. 创建完成后，运行以下命令添加项目成员："
    echo ""
    echo "      docker exec -it heuraideas-proto-v1-backend-1 python scripts/init_project_members.py 1"
    echo ""
else
    echo -e "${GREEN} 已有 $PROJECT_COUNT 个项目${NC}"
    
    # 检查项目结构是否完整
    STEPS_COUNT=$(docker exec aideas-db psql -U user -d aideas_db -t -c "SELECT COUNT(*) FROM project_steps WHERE project_id = 1;")
    SUBSTEPS_COUNT=$(docker exec aideas-db psql -U user -d aideas_db -t -c "SELECT COUNT(*) FROM project_substeps WHERE project_step_id IN (SELECT id FROM project_steps WHERE project_id = 1);")
    
    if [ "$STEPS_COUNT" -eq 0 ] || [ "$SUBSTEPS_COUNT" -eq 0 ]; then
        echo ""
        echo -e "${YELLOW} 项目结构不完整（缺少 Steps/Substeps）${NC}"
        echo ""
        echo "建议删除旧项目并通过前端重新创建："
        echo ""
        echo "      # 删除旧项目"
        echo "      docker exec aideas-db psql -U user -d aideas_db -c \"DELETE FROM project_members WHERE project_id = 1; DELETE FROM projects WHERE id = 1;\""
        echo ""
        echo "      # 重启后端"
        echo "      docker-compose restart backend"
        echo ""
        echo "      # 通过前端创建新项目"
        echo "      # 然后运行添加成员脚本"
        echo ""
    else
        echo -e "${GREEN} 项目结构完整 (Steps: $STEPS_COUNT, Substeps: $SUBSTEPS_COUNT)${NC}"
        echo ""
        # 自动初始化项目成员
        echo " 初始化项目成员..."
        docker exec -it heuraideas-proto-v1-backend-1 python scripts/init_project_members.py 1
    fi
fi
echo ""

echo ""
echo "=========================="
echo -e "${GREEN} 初始化完成！${NC}"
echo "=========================="
echo ""
echo "访问地址："
echo "   前端：http://localhost:5173"
echo "   后端：http://localhost:8000"
echo "   API 文档：http://localhost:8000/docs"
echo ""
echo "测试账号（密码都是 123456）："
echo "   Alice: alice@test.com (项目 Owner)"
echo "   Bob: bob@test.com (成员)"
echo "   Charlie: charlie@test.com (成员)"
echo ""
echo "测试步骤："
echo "   1. 打开 Chrome 正常窗口，登录 Alice"
echo "   2. 打开 Chrome 无痕窗口 (Ctrl+Shift+N)，登录 Bob"
echo "   3. 打开另一个 Chrome 无痕窗口，登录 Charlie"
echo "   4. 三人同时评论测试权限和并发！"
echo ""
echo "权限规则："
echo "   - 编辑评论：只有作者可以"
echo "   - 删除评论：只有作者可以"
echo "   - 删除回复：作者 + 项目 owner/admin"
echo "   - Resolve 评论：只有项目 owner/admin"
echo ""
echo "手动添加成员到项目："
echo "   docker exec -it heuraideas-proto-v1-backend-1 python scripts/init_project_members.py <项目 ID>"
echo ""
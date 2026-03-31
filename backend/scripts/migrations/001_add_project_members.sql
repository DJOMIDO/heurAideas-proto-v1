-- backend/scripts/migrations/001_add_project_members.sql

-- =====================================================
-- 迁移 001: 添加项目成员表
-- 描述：支持团队协作功能，记录项目与用户的多对多关系
-- 日期：2026-03-31
-- =====================================================

-- 1. 创建项目成员表
CREATE TABLE IF NOT EXISTS project_members (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL DEFAULT 'member',  -- owner, admin, member
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_project_user UNIQUE (project_id, user_id)
);

-- 2. 创建索引（提高查询性能）
CREATE INDEX IF NOT EXISTS idx_project_members_project ON project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_user ON project_members(user_id);

-- 3. 迁移现有项目创建者为 owner 角色
-- （确保向后兼容，creator 自动成为项目 owner）
INSERT INTO project_members (project_id, user_id, role, joined_at)
SELECT 
    p.id AS project_id,
    p.creator_id AS user_id,
    'owner' AS role,
    p.created_at AS joined_at
FROM projects p
WHERE p.creator_id IS NOT NULL
ON CONFLICT (project_id, user_id) DO NOTHING;

-- 4. 验证迁移结果
DO $$
DECLARE
    member_count INTEGER;
    project_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO member_count FROM project_members;
    SELECT COUNT(*) INTO project_count FROM projects;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE '迁移完成！';
    RAISE NOTICE '项目总数：%', project_count;
    RAISE NOTICE '成员记录数：%', member_count;
    RAISE NOTICE '========================================';
END $$;
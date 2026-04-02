#!/usr/bin/env python3
"""
初始化项目成员关系
运行：docker exec -it heuraideas-proto-v1-backend-1 python scripts/init_project_members.py
"""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy.orm import Session # pyright: ignore[reportMissingImports]
from app.database import SessionLocal
from app.models.user import User
from app.models.project import Project
from app.models.member import ProjectMember


def init_project_members(project_id: int = 1):
    """
    将测试用户添加为项目成员
    
    默认配置：
    - Alice: owner
    - Bob: member
    - Charlie: member
    """
    db = SessionLocal()
    
    # 获取项目
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        print(f"项目 ID {project_id} 不存在")
        db.close()
        return
    
    print(f"项目：{project.name} (ID={project_id})")
    
    # 测试用户邮箱
    test_emails = {
        "alice@test.com": "owner",
        "bob@test.com": "member",
        "charlie@test.com": "member",
    }
    
    for email, role in test_emails.items():
        user = db.query(User).filter(User.email == email).first()
        if not user:
            print(f"用户 {email} 不存在，跳过")
            continue
        
        # 检查是否已是成员
        existing = db.query(ProjectMember).filter(
            ProjectMember.project_id == project_id,
            ProjectMember.user_id == user.id
        ).first()
        
        if existing:
            print(f"{user.username} 已是项目成员 ({existing.role})")
        else:
            # 如果是 owner，检查是否已有 owner
            if role == "owner":
                existing_owner = db.query(ProjectMember).filter(
                    ProjectMember.project_id == project_id,
                    ProjectMember.role == "owner"
                ).first()
                if existing_owner:
                    print(f"项目已有 owner ({existing_owner.user_id})，跳过")
                    continue
            
            # 添加成员
            membership = ProjectMember(
                project_id=project_id,
                user_id=user.id,
                role=role,
            )
            db.add(membership)
            print(f"添加 {user.username} 为 {role}")
    
    db.commit()
    db.close()
    
    print("项目成员初始化完成！")
    
    # 显示最终成员列表
    db = SessionLocal()
    members = db.query(ProjectMember).filter(
        ProjectMember.project_id == project_id
    ).all()
    
    print(f"项目成员列表：")
    for member in members:
        user = db.query(User).filter(User.id == member.user_id).first()
        print(f"   - {user.username} ({user.email}) - {member.role}")
    
    db.close()


if __name__ == "__main__":
    import sys
    project_id = int(sys.argv[1]) if len(sys.argv) > 1 else 1
    init_project_members(project_id)

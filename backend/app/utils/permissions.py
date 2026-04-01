# backend/app/utils/permissions.py

"""
项目权限验证辅助函数

提供统一的权限检查逻辑，用于团队协作功能：
- 检查用户是否是项目成员
- 检查用户角色（owner/admin/member）
- 检查评论/回复的操作权限
"""

from sqlalchemy.orm import Session # pyright: ignore[reportMissingImports]
from app.models.member import ProjectMember
from app.models.project import Project
from typing import Optional


def is_project_member(db: Session, project_id: int, user_id: int) -> bool:
    """
    检查用户是否是项目成员
    
    Args:
        db: 数据库会话
        project_id: 项目 ID
        user_id: 用户 ID
        
    Returns:
        bool: 是否是项目成员
    """
    membership = db.query(ProjectMember).filter(
        ProjectMember.project_id == project_id,
        ProjectMember.user_id == user_id
    ).first()
    return membership is not None


def get_project_role(db: Session, project_id: int, user_id: int) -> Optional[str]:
    """
    获取用户在项目中的角色
    
    Args:
        db: 数据库会话
        project_id: 项目 ID
        user_id: 用户 ID
        
    Returns:
        str | None: 角色名称 (owner/admin/member) 或 None
    """
    membership = db.query(ProjectMember).filter(
        ProjectMember.project_id == project_id,
        ProjectMember.user_id == user_id
    ).first()
    return membership.role if membership else None


def is_project_owner_or_admin(db: Session, project_id: int, user_id: int) -> bool:
    """
    检查用户是否是项目 owner 或 admin
    
    Args:
        db: 数据库会话
        project_id: 项目 ID
        user_id: 用户 ID
        
    Returns:
        bool: 是否是 owner 或 admin
    """
    role = get_project_role(db, project_id, user_id)
    return role in ["owner", "admin"]


def can_access_project(db: Session, project_id: int, user_id: int) -> bool:
    """
    检查用户是否可以访问项目
    
    权限规则：
    - 项目创建者自动可以访问
    - 项目成员可以访问
    
    Args:
        db: 数据库会话
        project_id: 项目 ID
        user_id: 用户 ID
        
    Returns:
        bool: 是否可以访问
    """
    # 检查项目是否存在
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        return False
    
    # 创建者自动可以访问
    if project.creator_id == user_id:
        return True
    
    # 检查是否是成员
    return is_project_member(db, project_id, user_id)


def can_edit_comment(comment_author_id: int, current_user_id: int) -> bool:
    """
    检查是否可以编辑评论
    
    权限规则：
    - 只有评论作者可以编辑自己的评论
    
    Args:
        comment_author_id: 评论作者 ID
        current_user_id: 当前用户 ID
        
    Returns:
        bool: 是否可以编辑
    """
    return comment_author_id == current_user_id


def can_delete_comment(
    db: Session,
    comment_author_id: int,
    current_user_id: int,
    project_id: int,
    is_reply: bool = False
) -> bool:
    """
    检查是否可以删除评论
    
    权限规则：
    - 作者可以删除自己的评论/回复
    - 项目 owner/admin 可以删除任何回复
    - 父评论作者可以删除该评论下的回复
    
    Args:
        db: 数据库会话
        comment_author_id: 评论作者 ID
        current_user_id: 当前用户 ID
        project_id: 项目 ID
        is_reply: 是否是回复
        
    Returns:
        bool: 是否可以删除
    """
    # 作者可以删除自己的评论
    if comment_author_id == current_user_id:
        return True
    
    # 项目 owner/admin 可以删除任何回复
    if is_reply and is_project_owner_or_admin(db, project_id, current_user_id):
        return True
    
    return False


def can_resolve_comment(db: Session, project_id: int, current_user_id: int) -> bool:
    """
    检查是否可以 resolve 评论
    
    权限规则：
    - 只有项目 owner/admin 可以 resolve 任何评论
    
    Args:
        db: 数据库会话
        project_id: 项目 ID
        current_user_id: 当前用户 ID
        
    Returns:
        bool: 是否可以 resolve
    """
    return is_project_owner_or_admin(db, project_id, current_user_id)

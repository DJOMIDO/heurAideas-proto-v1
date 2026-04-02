# backend/app/api/members.py

from fastapi import APIRouter, Depends, HTTPException, status  # pyright: ignore[reportMissingImports]
from sqlalchemy.orm import Session  # pyright: ignore[reportMissingImports]
from typing import List
from app.database import get_db
from app.models.member import ProjectMember
from app.models.project import Project
from app.models.user import User
from app.schemas.member import (
    MemberCreate,
    MemberResponse,
    MemberListResponse,
    MemberAddResponse,
    ROLE_DESCRIPTIONS,
)
from app.api.auth import get_current_user
from app.utils.permissions import (
    is_project_owner_or_admin,
    can_access_project,
)

router = APIRouter(prefix="/projects/{project_id}/members", tags=["Members"])

# ==================== 获取项目成员列表 ====================

@router.get("/", response_model=MemberListResponse)
async def get_project_members(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """获取项目所有成员"""
    # 验证访问权限
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project or not can_access_project(db, project_id, current_user.id):
        raise HTTPException(status_code=404, detail="Project not found")
    
    # 查询成员
    memberships = db.query(ProjectMember).filter(
        ProjectMember.project_id == project_id
    ).all()
    
    # 构建响应
    members = []
    for membership in memberships:
        user = db.query(User).filter(User.id == membership.user_id).first()
        if user:
            members.append(MemberResponse(
                id=membership.id,
                project_id=membership.project_id,
                user_id=membership.user_id,
                role=membership.role,
                joined_at=membership.joined_at,
                user_email=user.email,
                user_username=user.username,
            ))
    
    return MemberListResponse(
        total=len(members),
        members=members
    )

# ==================== 添加项目成员 ====================

@router.post("/", response_model=MemberAddResponse)
async def add_project_member(
    project_id: int,
    member_data: MemberCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """添加项目成员（只有 owner/admin 可以）"""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    if not is_project_owner_or_admin(db, project_id, current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only project owner or admin can add members"
        )
    
    # 使用 user_id 查找用户
    new_member = db.query(User).filter(User.id == member_data.user_id).first()
    if not new_member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    existing = db.query(ProjectMember).filter(
        ProjectMember.project_id == project_id,
        ProjectMember.user_id == new_member.id
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is already a member of this project"
        )
    
    if member_data.role == "owner":
        existing_owner = db.query(ProjectMember).filter(
            ProjectMember.project_id == project_id,
            ProjectMember.role == "owner"
        ).first()
        if existing_owner:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Project already has an owner"
            )
    
    membership = ProjectMember(
        project_id=project_id,
        user_id=new_member.id,
        role=member_data.role or "member",
    )
    db.add(membership)
    db.commit()
    db.refresh(membership)
    
    return MemberAddResponse(
        project_id=project_id,
        user_id=new_member.id,
        role=membership.role,
        message=f"User {new_member.username} added as {membership.role}"
    )

# ==================== 更新成员角色 ====================

@router.put("/{user_id}/role")
async def update_member_role(
    project_id: int,
    user_id: int,
    role: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """更新成员角色（只有 owner 可以）"""
    # 验证项目存在
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # 验证权限（只有 owner 可以更新角色）
    current_role = db.query(ProjectMember).filter(
        ProjectMember.project_id == project_id,
        ProjectMember.user_id == current_user.id
    ).first()
    
    if not current_role or current_role.role != "owner":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only project owner can update member roles"
        )
    
    # 验证角色有效性
    if role not in ["owner", "admin", "member"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid role. Must be owner, admin, or member"
        )
    
    # 限制 owner 数量
    if role == "owner":
        existing_owner = db.query(ProjectMember).filter(
            ProjectMember.project_id == project_id,
            ProjectMember.role == "owner",
            ProjectMember.user_id != user_id
        ).first()
        if existing_owner:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Project already has an owner"
            )
    
    # 更新角色
    membership = db.query(ProjectMember).filter(
        ProjectMember.project_id == project_id,
        ProjectMember.user_id == user_id
    ).first()
    
    if not membership:
        raise HTTPException(status_code=404, detail="Member not found")
    
    membership.role = role
    db.commit()
    
    return {"message": f"Role updated to {role}"}

# ==================== 移除项目成员 ====================

@router.delete("/{user_id}")
async def remove_project_member(
    project_id: int,
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """移除项目成员（只有 owner/admin 可以）"""
    # 验证项目存在
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # 验证权限（只有 owner/admin 可以移除成员）
    if not is_project_owner_or_admin(db, project_id, current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only project owner or admin can remove members"
        )
    
    # 不能移除 owner
    target_membership = db.query(ProjectMember).filter(
        ProjectMember.project_id == project_id,
        ProjectMember.user_id == user_id
    ).first()
    
    if not target_membership:
        raise HTTPException(status_code=404, detail="Member not found")
    
    if target_membership.role == "owner":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot remove project owner"
        )
    
    # 删除成员
    db.query(ProjectMember).filter(
        ProjectMember.project_id == project_id,
        ProjectMember.user_id == user_id
    ).delete()
    db.commit()
    
    return {"message": "Member removed"}

# ==================== 获取可用角色列表 ====================

@router.get("/roles")
async def get_available_roles():
    """获取可用的项目角色列表"""
    return [
        {"role": role, "description": desc}
        for role, desc in ROLE_DESCRIPTIONS.items()
    ]

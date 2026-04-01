# backend/app/schemas/member.py

from pydantic import BaseModel, Field, EmailStr  # pyright: ignore[reportMissingImports]
from typing import Optional, List
from datetime import datetime

# ==================== 成员创建 ====================

class MemberCreate(BaseModel):
    """添加成员请求"""
    email: EmailStr = Field(..., description="用户邮箱")
    role: Optional[str] = Field(default="member", description="角色：owner, admin, member")

class MemberAddResponse(BaseModel):
    """添加成员响应"""
    project_id: int
    user_id: int
    role: str
    message: str

# ==================== 成员响应 ====================

class MemberResponse(BaseModel):
    """成员信息响应"""
    id: int
    project_id: int
    user_id: int
    role: str
    joined_at: datetime
    
    # 用户信息（嵌套）
    user_email: str
    user_username: str
    
    class Config:
        from_attributes = True

class MemberListResponse(BaseModel):
    """成员列表响应"""
    total: int
    members: List[MemberResponse]

# ==================== 角色枚举 ====================

class ProjectRole(BaseModel):
    """项目角色"""
    role: str
    description: str

ROLE_DESCRIPTIONS = {
    "owner": "项目所有者，拥有所有权限",
    "admin": "管理员，可管理成员和评论",
    "member": "普通成员，可查看和编辑内容"
}

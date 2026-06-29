# backend/app/schemas/member.py

from pydantic import BaseModel, Field, EmailStr  # pyright: ignore[reportMissingImports]
from typing import Optional, List
from datetime import datetime

class MemberCreate(BaseModel):
    user_id: int = Field(..., description="User ID") 
    role: Optional[str] = Field(default="member", description="Permission role：owner, admin, member")
    business_role: Optional[str] = Field(default=None, description="Business role：Project leader, etc.")

class MemberAddResponse(BaseModel):
    project_id: int
    user_id: int
    role: str
    message: str

class MemberResponse(BaseModel):
    id: int
    project_id: int
    user_id: int
    role: str
    business_role: Optional[str] = None
    joined_at: datetime
    user_email: str
    user_username: str
    
    class Config:
        from_attributes = True

class MemberListResponse(BaseModel):
    total: int
    members: List[MemberResponse]

class ProjectRole(BaseModel):
    role: str
    description: str

ROLE_DESCRIPTIONS = {
    "owner": "Owner, full permissions including managing members and project settings",
    "admin": "Admin, can manage members and comments",
    "member": "Member, can view and edit content"
}

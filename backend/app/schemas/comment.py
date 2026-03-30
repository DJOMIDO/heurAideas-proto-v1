# backend/app/schemas/comment.py

from pydantic import BaseModel, Field, validator  # pyright: ignore[reportMissingImports]
from typing import Optional, List
from datetime import datetime


# ==================== 基础 Schema ====================

class CommentBase(BaseModel):
    content: str = Field(..., min_length=1, max_length=10000, description="Comment content")
    position_x: Optional[int] = Field(default=None, description="Marker X position")
    position_y: Optional[int] = Field(default=None, description="Marker Y position")
    anchor_type: str = Field(default="free", description="free, element, stakeholder, section")
    anchor_id: Optional[str] = Field(default=None, description="Anchor element ID")
    project_subtask_code: Optional[str] = Field(default=None, description="Subtask code like 'a', 'b', 'c'")

    @validator('anchor_type')
    def validate_anchor_type(cls, v):
        allowed = ["free", "element", "stakeholder", "section"]
        if v not in allowed:
            raise ValueError(f"anchor_type must be one of {allowed}")
        return v


class CommentCreate(CommentBase):
    project_id: int
    project_substep_id: int
    project_step_id: Optional[int] = Field(default=None)
    parent_id: Optional[int] = Field(default=None, description="Parent comment ID for reply")


class CommentUpdate(BaseModel):
    content: Optional[str] = Field(default=None, min_length=1, max_length=10000)
    position_x: Optional[int] = None
    position_y: Optional[int] = None
    is_resolved: Optional[bool] = None
    is_deleted: Optional[bool] = None


# ==================== 响应 Schema ====================

class CommentResponse(CommentBase):
    id: int
    project_id: int
    project_step_id: Optional[int]
    project_substep_id: int
    project_subtask_id: Optional[int]
    project_subtask_code: Optional[str] = None
    author_id: int
    author_name: Optional[str]
    is_resolved: bool
    is_deleted: bool
    is_edited: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    replies: List["CommentResponse"] = Field(default_factory=list)

    class Config:
        from_attributes = True


class CommentListResponse(BaseModel):
    total: int
    comments: List[CommentResponse]
    resolved_count: int
    unresolved_count: int


# ==================== 统计 Schema ====================

class CommentCountResponse(BaseModel):
    total: int
    resolved: int
    unresolved: int
    by_substep: dict  # {substep_code: count}


# 更新 forward reference
CommentResponse.update_forward_refs()

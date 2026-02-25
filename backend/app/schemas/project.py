# backend/app/schemas/project.py

from pydantic import BaseModel, Field  # pyright: ignore[reportMissingImports]
from typing import Optional, List
from datetime import datetime


# ==================== 项目相关 ====================

class ProjectCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200, description="Project Name")
    description: Optional[str] = Field(default=None, description="Project Description")
    template_id: Optional[int] = Field(default=None, description="Template ID")


class ProjectResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    creator_id: int
    template_id: Optional[int]
    status: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ProjectListResponse(BaseModel):
    id: int
    name: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


# ==================== 步骤相关 ====================

class ProjectStepResponse(BaseModel):
    id: int
    code: str
    title: str
    description: Optional[str]
    status: str
    order: int

    class Config:
        from_attributes = True


# ==================== 子步骤相关 ====================

class ProjectSubtaskResponse(BaseModel):
    id: int
    code: str
    title: str
    order: int

    class Config:
        from_attributes = True


class ProjectSubstepResponse(BaseModel):
    id: int
    code: str
    title: str
    description: Optional[str]
    status: str
    order: int
    subtasks: List[ProjectSubtaskResponse] = []

    class Config:
        from_attributes = True


# ==================== 内容相关 ====================

class SubstepContentCreate(BaseModel):
    content_data: Optional[dict] = Field(default=None, description="Substep Content Data")
    ui_state: Optional[dict] = Field(default=None, description="UI State")


class SubstepContentResponse(BaseModel):
    id: int
    project_substep_id: int
    content_data: Optional[dict]
    ui_state: Optional[dict]
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ==================== 完整项目树（嵌套结构） ====================

class ProjectStepDetail(BaseModel):
    """步骤详情（包含子步骤列表）"""
    id: int
    code: str
    title: str
    description: Optional[str]
    status: str
    order: int
    substeps: List[ProjectSubstepResponse] = []

    class Config:
        from_attributes = True


class ProjectDetailResponse(BaseModel):
    """项目详情响应（包含完整步骤树）"""
    id: int
    name: str
    description: Optional[str]
    status: str
    creator_id: int
    template_id: Optional[int]
    created_at: datetime
    updated_at: Optional[datetime] = None
    steps: List[ProjectStepDetail] = []

    class Config:
        from_attributes = True

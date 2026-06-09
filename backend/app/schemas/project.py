# backend/app/schemas/project.py

from pydantic import BaseModel, Field  # pyright: ignore[reportMissingImports]
from typing import Optional, List
from datetime import datetime


# ==================== Project Related ====================

class ProjectCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200, description="Project Name")
    description: Optional[str] = Field(default=None, description="Project Description")
    template_id: Optional[int] = Field(default=None, description="Template ID")
    visibility: str = Field(default="private", description="private, group, or public")


class ProjectResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    creator_id: int
    template_id: Optional[int]
    status: str
    visibility: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ProjectListResponse(BaseModel):
    id: int
    name: str
    status: str
    visibility: str
    created_at: datetime

    class Config:
        from_attributes = True


# ==================== Step Related ====================

class ProjectStepResponse(BaseModel):
    id: int
    code: str
    title: str
    description: Optional[str]
    status: str
    order: int

    class Config:
        from_attributes = True


# ==================== Substep Related ====================

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


# ==================== Content Related ====================

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


# ==================== Project Detail ====================

class ProjectStepDetail(BaseModel):
    """Project Step Detail (Substeps included)"""
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
    """Project Detail Response (includes complete step tree)"""
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

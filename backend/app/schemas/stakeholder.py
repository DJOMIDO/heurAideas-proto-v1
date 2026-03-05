# backend/app/schemas/stakeholder.py

from pydantic import BaseModel, Field, validator # pyright: ignore[reportMissingImports]
from typing import Optional, List
from datetime import datetime


class StakeholderBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    roles: Optional[List[str]] = Field(default=None, max_items=3)
    primary_role: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = Field(default=None, max_length=50)
    is_global: bool = False

    @validator('roles')
    def validate_roles(cls, v):
        if v and len(v) > 3:
            raise ValueError("Maximum 3 roles allowed")
        return v


class StakeholderCreate(StakeholderBase):
    project_id: int
    creator_id: Optional[int] = None


class StakeholderResponse(StakeholderBase):
    id: int
    project_id: int
    creator_id: Optional[int]
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class StakeholderListResponse(BaseModel):
    id: int
    name: str
    roles: Optional[List[str]]
    primary_role: Optional[str]
    category: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

# backend/app/schemas/document.py

from pydantic import BaseModel, Field # pyright: ignore[reportMissingImports]
from typing import Optional, List

class DocumentFolderCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200, description="Folder Name")
    parent_id: Optional[str] = Field(default=None, description="Parent Folder ID")

class DocumentNodeResponse(BaseModel):
    id: str
    name: str
    type: str
    
    projectId: int
    parentId: Optional[str] = None
    
    extension: Optional[str] = None
    size: Optional[int] = None
    updatedAt: Optional[str] = None
    
    url: Optional[str] = None
    
    children: List["DocumentNodeResponse"] = []

    tags: List[str] = []

    class Config:
        from_attributes = True
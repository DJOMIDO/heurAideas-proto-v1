# backend/app/schemas/document.py

from pydantic import BaseModel, Field # pyright: ignore[reportMissingImports]
from typing import Optional, List


# ==================== Input Models ====================

class DocumentFolderCreate(BaseModel):
    """创建文件夹请求体 (JSON)"""
    name: str = Field(..., min_length=1, max_length=200, description="Folder Name")
    parent_id: Optional[str] = Field(default=None, description="Parent Folder ID")


# ==================== Output Models ====================

class DocumentNodeResponse(BaseModel):
    """
    文档树节点响应（对应前端 DocumentNode 类型）
    注意：字段名使用 camelCase 以直接匹配前端类型定义
    """
    id: str
    name: str
    type: str  # "file" or "folder"
    
    # 关联信息
    projectId: int
    parentId: Optional[str] = None
    
    # 文件属性
    extension: Optional[str] = None
    size: Optional[int] = None      # 对应数据库 file_size
    updatedAt: Optional[str] = None # 对应数据库 updated_at
    
    # 存储/访问
    url: Optional[str] = None
    
    # 子节点
    children: List["DocumentNodeResponse"] = []

    tags: List[str] = []

    class Config:
        from_attributes = True
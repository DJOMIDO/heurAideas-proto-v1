# backend/app/models/document.py

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, BigInteger, Text  # pyright: ignore[reportMissingImports]
from sqlalchemy.sql import func  # pyright: ignore[reportMissingImports]
from sqlalchemy.orm import relationship  # pyright: ignore[reportMissingImports]
from app.database import Base


class Document(Base):
    __tablename__ = "documents"

    # ==================== Main Key ====================
    id = Column(String(100), primary_key=True, index=True)  # UUID 格式：file-xxx / folder-xxx

    # ==================== Foreign Keys ====================
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False, index=True)
    parent_id = Column(String(100), ForeignKey("documents.id"), nullable=True, index=True)  # 树形结构
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)

    # ==================== Basic Information ====================
    name = Column(String(200), nullable=False)
    type = Column(String(20), nullable=False)  # "file" or "folder"
    extension = Column(String(50), nullable=True)  # pdf, docx, png 等
    description = Column(Text, nullable=True)

    # ==================== Supabase Storage Path ====================
    storage_path = Column(String(500), nullable=True, index=True)  # 格式: "{project_id}/{uuid}.{ext}"
    file_size = Column(BigInteger, nullable=True)  # bytes
    mime_type = Column(String(100), nullable=True)  # application/pdf 等

    # ==================== Timestamps ====================
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # ==================== Relationships ====================
    parent = relationship(
        "Document",
        remote_side=[id],
        backref="children",
        foreign_keys=[parent_id]
    )
    project = relationship("Project", back_populates="documents")
    creator = relationship("User", backref="created_documents")

    # ==================== Helper Methods ====================
    def to_node_dict(self, include_children: bool = False) -> dict:
        """Transform to DocumentNode format"""
        node = {
            "id": self.id,
            "name": self.name,
            "type": self.type,
            "projectId": self.project_id,
            "parentId": self.parent_id,
            "extension": self.extension,
            "size": self.file_size,
            "updatedAt": self.updated_at.isoformat() if self.updated_at else None,
            "url": self._get_public_url() if self.storage_path else None,
        }
        
        if include_children and self.type == "folder":
            node["children"] = [child.to_node_dict(include_children=True) for child in self.children]
        else:
            node["children"] = []
        
        return node

    def _get_public_url(self) -> str:
        """生成公开访问 URL（智能处理本地/生产环境）"""
        if not self.storage_path:
            return None
    
        from app.core.config import settings
    
        # 如果 storage_path 已经是完整 URL（以 http 开头），直接返回
        if self.storage_path.startswith("http"):
            return self.storage_path
    
        # 本地开发模式：storage_path 格式为 "uploads/1/folder-xxx/file-xxx.pdf"
        # 由 FastAPI 静态文件服务提供，返回以 / 开头的相对路径
        if self.storage_path.startswith("uploads/"):
            return f"/{self.storage_path}"  # 返回: "/uploads/1/folder-xxx/file-xxx.pdf"
    
        # Supabase 生产模式：storage_path 格式为 "1/folder-xxx/file-xxx.pdf"
        # 拼接完整 Supabase Storage URL
        return f"{settings.SUPABASE_URL}/storage/v1/object/public/{settings.SUPABASE_BUCKET}/{self.storage_path}"

    def __repr__(self):
        return f"<Document(id={self.id}, name='{self.name}', type='{self.type}')>"

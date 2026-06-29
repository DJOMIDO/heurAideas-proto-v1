# backend/app/models/document.py

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, BigInteger, Text, JSON  # pyright: ignore[reportMissingImports]
from sqlalchemy.sql import func  # pyright: ignore[reportMissingImports]
from sqlalchemy.orm import relationship  # pyright: ignore[reportMissingImports]
from app.database import Base


class Document(Base):
    __tablename__ = "documents"

    id = Column(String(100), primary_key=True, index=True)

    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False, index=True)
    parent_id = Column(String(100), ForeignKey("documents.id"), nullable=True, index=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)

    name = Column(String(200), nullable=False)
    type = Column(String(20), nullable=False)
    extension = Column(String(50), nullable=True)
    description = Column(Text, nullable=True)

    storage_path = Column(String(500), nullable=True, index=True)
    file_size = Column(BigInteger, nullable=True)
    mime_type = Column(String(100), nullable=True)
    tags = Column(JSON, nullable=True, default=list)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    parent = relationship(
        "Document",
        remote_side=[id],
        backref="children",
        foreign_keys=[parent_id]
    )
    project = relationship("Project", back_populates="documents")
    creator = relationship("User", backref="created_documents")

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
        if not self.storage_path:
            return None
    
        from app.core.config import settings
    
        if self.storage_path.startswith("http"):
            return self.storage_path
    
        if self.storage_path.startswith("uploads/"):
            return f"/{self.storage_path}"
    
        return f"{settings.SUPABASE_URL}/storage/v1/object/public/{settings.SUPABASE_BUCKET}/{self.storage_path}"

    def __repr__(self):
        return f"<Document(id={self.id}, name='{self.name}', type='{self.type}')>"

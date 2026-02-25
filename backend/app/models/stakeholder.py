from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey # pyright: ignore[reportMissingImports]
from sqlalchemy.sql import func # pyright: ignore[reportMissingImports]
from sqlalchemy.orm import relationship # pyright: ignore[reportMissingImports]
from app.database import Base


class Stakeholder(Base):
    __tablename__ = "stakeholders"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    creator_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String(200), nullable=False)
    role = Column(String(200), nullable=True)
    description = Column(Text, nullable=True)
    category = Column(String(50), nullable=True)  # internal, external, soi, etc.
    is_global = Column(Boolean, default=False)  # 是否可跨项目复用
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # 关系
    project = relationship("Project")
    creator = relationship("User")

    def __repr__(self):
        return f"<Stakeholder(id={self.id}, name='{self.name}', project_id={self.project_id})>"
    
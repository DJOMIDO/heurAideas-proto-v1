from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, JSON, UniqueConstraint # pyright: ignore[reportMissingImports]
from sqlalchemy.sql import func # pyright: ignore[reportMissingImports]
from sqlalchemy.orm import relationship # pyright: ignore[reportMissingImports]
from app.database import Base


class Stakeholder(Base):
    __tablename__ = "stakeholders"
    __table_args__ = (
        UniqueConstraint('project_id', 'substep_id', 'name', name='uix_project_substep_stakeholder'),
    )

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    substep_id = Column(String(20), nullable=True, index=True)
    creator_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    name = Column(String(200), nullable=False, index=True)
    roles = Column(JSON, nullable=True)
    is_global = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    project = relationship("Project")
    creator = relationship("User")

    def __repr__(self):
        return f"<Stakeholder(id={self.id}, name='{self.name}', substep_id='{self.substep_id}')>"
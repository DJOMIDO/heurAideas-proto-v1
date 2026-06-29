# backend/app/models/member.py

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, UniqueConstraint  # pyright: ignore[reportMissingImports]
from sqlalchemy.sql import func  # pyright: ignore[reportMissingImports]
from sqlalchemy.orm import relationship  # pyright: ignore[reportMissingImports]
from app.database import Base


class ProjectMember(Base):
    __tablename__ = "project_members"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    role = Column(String(50), nullable=False, default="member")
    business_role = Column(String(100), nullable=True)
    joined_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        UniqueConstraint('project_id', 'user_id', name='uq_project_user'),
    )

    project = relationship("Project", back_populates="members")
    user = relationship("User")

    def __repr__(self):
        return f"<ProjectMember(project_id={self.project_id}, user_id={self.user_id}, role={self.role})>"

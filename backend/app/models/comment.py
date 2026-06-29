# backend/app/models/comment.py

from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, JSON # pyright: ignore[reportMissingImports]
from sqlalchemy.sql import func # pyright: ignore[reportMissingImports]
from sqlalchemy.orm import relationship, backref # pyright: ignore[reportMissingImports]
from app.database import Base


class Comment(Base):
    __tablename__ = "comments"

    id = Column(Integer, primary_key=True, index=True)

    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False, index=True)
    project_step_id = Column(Integer, ForeignKey("project_steps.id"), nullable=True, index=True)
    project_substep_id = Column(Integer, ForeignKey("project_substeps.id"), nullable=False, index=True)
    project_subtask_id = Column(Integer, ForeignKey("project_subtasks.id"), nullable=True, index=True)

    position_x = Column(Integer, nullable=True)
    position_y = Column(Integer, nullable=True)
    anchor_type = Column(String(50), default="free")
    anchor_id = Column(String(200), nullable=True)

    content = Column(Text, nullable=False)

    parent_id = Column(Integer, ForeignKey("comments.id"), nullable=True, index=True)

    is_resolved = Column(Boolean, default=False, index=True)
    is_deleted = Column(Boolean, default=False)
    is_edited = Column(Boolean, default=False)

    author_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    author_name = Column(String(100), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    deleted_at = Column(DateTime(timezone=True), nullable=True)

    team_id = Column(Integer, nullable=True, index=True)

    author = relationship("User", foreign_keys=[author_id])
    project = relationship("Project")
    step = relationship("ProjectStep")
    substep = relationship("ProjectSubstep")
    subtask = relationship("ProjectSubtask")
    parent = relationship("Comment", remote_side=[id], backref=backref("replies", order_by="Comment.created_at"))

    def __repr__(self):
        return f"<Comment(id={self.id}, project_id={self.project_id}, substep_id={self.project_substep_id})>"

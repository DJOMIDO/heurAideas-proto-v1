# backend/app/models/comment.py

from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, JSON # pyright: ignore[reportMissingImports]
from sqlalchemy.sql import func # pyright: ignore[reportMissingImports]
from sqlalchemy.orm import relationship, backref # pyright: ignore[reportMissingImports]
from app.database import Base


class Comment(Base):
    __tablename__ = "comments"

    id = Column(Integer, primary_key=True, index=True)
    
    # 项目关联
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False, index=True)
    project_step_id = Column(Integer, ForeignKey("project_steps.id"), nullable=True, index=True)
    project_substep_id = Column(Integer, ForeignKey("project_substeps.id"), nullable=False, index=True)
    project_subtask_id = Column(Integer, ForeignKey("project_subtasks.id"), nullable=True, index=True)
    
    # 评论位置（用于前端 Marker 定位）
    position_x = Column(Integer, nullable=True)
    position_y = Column(Integer, nullable=True)
    anchor_type = Column(String(50), default="free")  # free, element, stakeholder, section
    anchor_id = Column(String(200), nullable=True)    # 锚点元素 ID
    
    # 评论内容
    content = Column(Text, nullable=False)
    
    # 回复关系（自关联）
    parent_id = Column(Integer, ForeignKey("comments.id"), nullable=True, index=True)
    
    # 状态
    is_resolved = Column(Boolean, default=False, index=True)
    is_deleted = Column(Boolean, default=False)  # 软删除
    is_edited = Column(Boolean, default=False)
    
    # 用户信息
    author_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    author_name = Column(String(100), nullable=True)  # 冗余存储，避免频繁 join
    
    # 时间戳
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    deleted_at = Column(DateTime(timezone=True), nullable=True)
    
    # 团队协作预留
    team_id = Column(Integer, nullable=True, index=True)  # 未来团队功能
    
    # 关系
    author = relationship("User", foreign_keys=[author_id])
    project = relationship("Project")
    step = relationship("ProjectStep")
    substep = relationship("ProjectSubstep")
    subtask = relationship("ProjectSubtask")
    parent = relationship("Comment", remote_side=[id], backref=backref("replies", order_by="Comment.created_at"))

    def __repr__(self):
        return f"<Comment(id={self.id}, project_id={self.project_id}, substep_id={self.project_substep_id})>"

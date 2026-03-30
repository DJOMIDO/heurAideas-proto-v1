from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, JSON, Boolean # pyright: ignore[reportMissingImports]
from sqlalchemy.sql import func # pyright: ignore[reportMissingImports]
from sqlalchemy.orm import relationship # pyright: ignore[reportMissingImports]
from app.database import Base


class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    creator_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    template_id = Column(Integer, ForeignKey("project_templates.id"), nullable=True)
    template_version = Column(String(50), nullable=True)
    status = Column(String(50), default="draft")  # draft, in_progress, completed, archived
    workspace_id = Column(Integer, nullable=True)  # 预留：未来团队功能
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # 关系
    creator = relationship("User", back_populates="projects")
    template = relationship("ProjectTemplate")
    steps = relationship(
        "ProjectStep",
        back_populates="project",
        cascade="all, delete-orphan",
        order_by="ProjectStep.order"
    )

    def __repr__(self):
        return f"<Project(id={self.id}, name='{self.name}', creator_id={self.creator_id})>"


class ProjectStep(Base):
    __tablename__ = "project_steps"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    template_step_id = Column(Integer, ForeignKey("template_steps.id"), nullable=True)
    code = Column(String(20), nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String(50), default="todo")  # todo, in_progress, completed
    order = Column(Integer, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # 关系
    project = relationship("Project", back_populates="steps")
    substeps = relationship(
        "ProjectSubstep",
        back_populates="step",
        cascade="all, delete-orphan",
        order_by="ProjectSubstep.order"
    )

    def __repr__(self):
        return f"<ProjectStep(id={self.id}, code='{self.code}', title='{self.title}')>"


class ProjectSubstep(Base):
    __tablename__ = "project_substeps"

    id = Column(Integer, primary_key=True, index=True)
    project_step_id = Column(Integer, ForeignKey("project_steps.id"), nullable=False)
    template_substep_id = Column(Integer, ForeignKey("template_substeps.id"), nullable=True)
    code = Column(String(20), nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String(50), default="todo")
    order = Column(Integer, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # 关系
    step = relationship("ProjectStep", back_populates="substeps")
    subtasks = relationship(
        "ProjectSubtask",
        back_populates="substep",
        cascade="all, delete-orphan",
        order_by="ProjectSubtask.order"
    )
    content = relationship(
        "SubstepContent",
        back_populates="substep",
        uselist=False,
        cascade="all, delete-orphan"
    )
    attachments = relationship(
        "Attachment",
        back_populates="substep",
        cascade="all, delete-orphan"
    )

    def __repr__(self):
        return f"<ProjectSubstep(id={self.id}, code='{self.code}', title='{self.title}')>"


class ProjectSubtask(Base):
    __tablename__ = "project_subtasks"

    id = Column(Integer, primary_key=True, index=True)
    project_substep_id = Column(Integer, ForeignKey("project_substeps.id"), nullable=False)
    template_subtask_id = Column(Integer, ForeignKey("template_subtasks.id"), nullable=True)
    code = Column(String(20), nullable=False)
    title = Column(String(200), nullable=False)
    order = Column(Integer, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # 关系
    substep = relationship("ProjectSubstep", back_populates="subtasks")

    def __repr__(self):
        return f"<ProjectSubtask(id={self.id}, code='{self.code}', title='{self.title}')>"


class SubstepContent(Base):
    __tablename__ = "substep_contents"

    id = Column(Integer, primary_key=True, index=True)
    project_substep_id = Column(Integer, ForeignKey("project_substeps.id"), unique=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    content_data = Column(JSON, nullable=True)  # 所有 Subtask 的内容
    ui_state = Column(JSON, nullable=True)  # Tab 状态、分屏状态等
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # 关系
    substep = relationship("ProjectSubstep", back_populates="content")
    editor = relationship("User")

    def __repr__(self):
        return f"<SubstepContent(id={self.id}, project_substep_id={self.project_substep_id})>"


class Attachment(Base):
    __tablename__ = "attachments"

    id = Column(Integer, primary_key=True, index=True)
    project_substep_id = Column(Integer, ForeignKey("project_substeps.id"), nullable=False)
    file_name = Column(String(500), nullable=False)
    minio_key = Column(String(500), nullable=False)
    file_type = Column(String(100), nullable=True)
    file_size = Column(Integer, nullable=True)
    uploaded_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # 关系
    substep = relationship("ProjectSubstep", back_populates="attachments")
    uploader = relationship("User")

    def __repr__(self):
        return f"<Attachment(id={self.id}, file_name='{self.file_name}')>"
    
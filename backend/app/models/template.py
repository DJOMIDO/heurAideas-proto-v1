from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, JSON # pyright: ignore[reportMissingImports]
from sqlalchemy.sql import func # pyright: ignore[reportMissingImports]
from sqlalchemy.orm import relationship # pyright: ignore[reportMissingImports]
from app.database import Base


class ProjectTemplate(Base):
    __tablename__ = "project_templates"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    version = Column(String(50), nullable=False)
    description = Column(Text, nullable=True)
    is_default = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # 关系
    template_steps = relationship(
        "TemplateStep",
        back_populates="template",
        cascade="all, delete-orphan",
        order_by="TemplateStep.order"
    )

    def __repr__(self):
        return f"<ProjectTemplate(id={self.id}, name='{self.name}', version='{self.version}')>"


class TemplateStep(Base):
    __tablename__ = "template_steps"

    id = Column(Integer, primary_key=True, index=True)
    template_id = Column(Integer, ForeignKey("project_templates.id"), nullable=False)
    code = Column(String(20), nullable=False)  # 业务 ID，如 "1"
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    order = Column(Integer, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # 关系
    template = relationship("ProjectTemplate", back_populates="template_steps")
    template_substeps = relationship(
        "TemplateSubstep",
        back_populates="template_step",
        cascade="all, delete-orphan",
        order_by="TemplateSubstep.order"
    )

    def __repr__(self):
        return f"<TemplateStep(id={self.id}, code='{self.code}', title='{self.title}')>"


class TemplateSubstep(Base):
    __tablename__ = "template_substeps"

    id = Column(Integer, primary_key=True, index=True)
    template_step_id = Column(Integer, ForeignKey("template_steps.id"), nullable=False)
    code = Column(String(20), nullable=False)  # 业务 ID，如 "1.1"
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    order = Column(Integer, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # 关系
    template_step = relationship("TemplateStep", back_populates="template_substeps")
    template_subtasks = relationship(
        "TemplateSubtask",
        back_populates="template_substep",
        cascade="all, delete-orphan",
        order_by="TemplateSubtask.order"
    )

    def __repr__(self):
        return f"<TemplateSubstep(id={self.id}, code='{self.code}', title='{self.title}')>"


class TemplateSubtask(Base):
    __tablename__ = "template_subtasks"

    id = Column(Integer, primary_key=True, index=True)
    template_substep_id = Column(Integer, ForeignKey("template_substeps.id"), nullable=False)
    code = Column(String(20), nullable=False)  # 业务 ID，如 "a"
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    objective = Column(Text, nullable=True)
    actions = Column(Text, nullable=True)
    recommended_documentation = Column(Text, nullable=True)
    field_config = Column(JSON, nullable=True)  # 表单配置
    order = Column(Integer, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # 关系
    template_substep = relationship("TemplateSubstep", back_populates="template_subtasks")

    def __repr__(self):
        return f"<TemplateSubtask(id={self.id}, code='{self.code}', title='{self.title}')>"
    
# backend/app/api/projects.py

from app.schemas.stakeholder import StakeholderListResponse
from fastapi import APIRouter, Depends, HTTPException, status  # pyright: ignore[reportMissingImports]
from sqlalchemy.orm import Session  # pyright: ignore[reportMissingImports]
from sqlalchemy.sql import func # pyright: ignore[reportMissingImports]
from typing import List, Optional  # pyright: ignore[reportMissingImports]
import re

from app.database import get_db
from app.models.project import Project, ProjectStep, ProjectSubstep, ProjectSubtask, SubstepContent
from app.models.stakeholder import Stakeholder
from app.models.template import ProjectTemplate, TemplateStep, TemplateSubstep, TemplateSubtask
from app.schemas.project import (
    ProjectCreate,
    ProjectResponse,
    ProjectListResponse,
    ProjectDetailResponse,
    SubstepContentCreate,
    SubstepContentResponse,
)
from app.api.auth import get_current_user
from app.models.user import User

router = APIRouter(prefix="/projects", tags=["Projects"])


# ==================== 辅助函数：保存 Stakeholder 数据 ====================

async def save_stakeholders(
    db: Session,
    project_id: int,
    user_id: int,
    content_data: dict
):
    """
    从 content_data 中提取 stakeholder 数据并保存到 stakeholders 表
    
    支持嵌套结构：{"subtask-a": {"stakeholder-role-0": "S1", ...}}
    扁平化为：{"subtask-a-stakeholder-role-0": "S1", ...}
    
    同步逻辑：
    - 前端存在的 → 创建或更新
    - 前端删除的 → 从数据库删除
    """
    
    # 1. 扁平化嵌套结构
    flat_content_data = {}
    for subtask_key, subtask_data in content_data.items():
        if isinstance(subtask_data, dict):
            for key, value in subtask_data.items():
                flat_content_data[f"{subtask_key}-{key}"] = value
        else:
            flat_content_data[subtask_key] = subtask_data
    
    # 2. 收集前端所有 stakeholder 数据
    frontend_stakeholders = set()
    stakeholders_data = {}
    
    for key, value in flat_content_data.items():
        if not isinstance(value, str):
            continue
        
        value_stripped = value.strip()
        if not value_stripped and '-role' not in key:
            continue
        
        # 精确匹配 name 字段
        if re.match(r'^subtask-.*-stakeholder-role-\d+$', key):
            name = value_stripped
            if name:
                frontend_stakeholders.add(name)
                if name not in stakeholders_data:
                    stakeholders_data[name] = {"roles": []}
        
        # 精确匹配 role 字段
        elif re.match(r'^subtask-.*-stakeholder-role-\d+-role$', key):
            role_string = value_stripped
            name_key = key[:-5]  # 只删除末尾的 '-role'
            name_value = flat_content_data.get(name_key, '')
            if isinstance(name_value, str):
                name_value = name_value.strip()
            else:
                name_value = ''
            
            if name_value:
                if name_value not in stakeholders_data:
                    stakeholders_data[name_value] = {"roles": []}
                
                if role_string:
                    roles = [r.strip() for r in role_string.split(",") if r.strip()]
                    stakeholders_data[name_value]["roles"].extend(roles)
    
    # 3. 获取数据库现有 stakeholder
    existing_stakeholders = db.query(Stakeholder).filter(
        Stakeholder.project_id == project_id
    ).all()
    
    existing_names = {s.name for s in existing_stakeholders}
    
    # 4. 删除前端已删除的
    for name in existing_names - frontend_stakeholders:
        db.query(Stakeholder).filter(
            Stakeholder.project_id == project_id,
            Stakeholder.name == name
        ).delete()
    
    # 5. 创建或更新前端存在的
    for name, data in stakeholders_data.items():
        unique_roles = list(dict.fromkeys(data["roles"]))[:3]
        primary_role = unique_roles[0] if unique_roles else None
        
        existing = db.query(Stakeholder).filter(
            Stakeholder.project_id == project_id,
            Stakeholder.name == name
        ).first()
        
        if existing:
            existing_roles = existing.roles or []
            merged_roles = list(dict.fromkeys(existing_roles + unique_roles))[:3]
            existing.roles = merged_roles
            existing.primary_role = merged_roles[0] if merged_roles else None
        else:
            stakeholder = Stakeholder(
                project_id=project_id,
                creator_id=user_id,
                name=name,
                roles=unique_roles,
                primary_role=primary_role,
                category="external",
                is_global=False
            )
            db.add(stakeholder)
    
    db.commit()
    

# ==================== 创建项目（使用真实用户 ID）====================

@router.post("/", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project(
    project: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 1. 获取模板
    template_id = project.template_id
    if not template_id:
        template = db.query(ProjectTemplate).filter(ProjectTemplate.is_default == True).first()
        if not template:
            raise HTTPException(status_code=400, detail="No default template available")
        template_id = template.id
    else:
        template = db.query(ProjectTemplate).filter(ProjectTemplate.id == template_id).first()
        if not template:
            raise HTTPException(status_code=404, detail="Template not found")
    
    # 2. 创建项目记录（使用真实用户 ID）
    db_project = Project(
        name=project.name,
        description=project.description,
        creator_id=current_user.id,
        template_id=template.id,
        template_version=template.version,
        status="draft"
    )
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    
    # 3. 复制模板结构到项目实例
    template_steps = db.query(TemplateStep).filter(TemplateStep.template_id == template.id).order_by(TemplateStep.order).all()
    
    for t_step in template_steps:
        p_step = ProjectStep(
            project_id=db_project.id,
            template_step_id=t_step.id,
            code=t_step.code,
            title=t_step.title,
            description=t_step.description,
            status="todo",
            order=t_step.order
        )
        db.add(p_step)
        db.commit()
        db.refresh(p_step)
        
        template_substeps = db.query(TemplateSubstep).filter(TemplateSubstep.template_step_id == t_step.id).order_by(TemplateSubstep.order).all()
        
        for t_substep in template_substeps:
            p_substep = ProjectSubstep(
                project_step_id=p_step.id,
                template_substep_id=t_substep.id,
                code=t_substep.code,
                title=t_substep.title,
                description=t_substep.description,
                status="todo",
                order=t_substep.order
            )
            db.add(p_substep)
            db.commit()
            db.refresh(p_substep)
            
            template_subtasks = db.query(TemplateSubtask).filter(TemplateSubtask.template_substep_id == t_substep.id).order_by(TemplateSubtask.order).all()
            
            for t_subtask in template_subtasks:
                p_subtask = ProjectSubtask(
                    project_substep_id=p_substep.id,
                    template_subtask_id=t_subtask.id,
                    code=t_subtask.code,
                    title=t_subtask.title,
                    order=t_subtask.order
                )
                db.add(p_subtask)
                db.commit()
    
    db.commit()
    return db_project


# ==================== 获取项目列表（只返回当前用户的项目）====================

@router.get("/", response_model=List[ProjectListResponse])
async def get_projects(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 只查询当前用户的项目
    projects = db.query(Project).filter(
        Project.creator_id == current_user.id
    ).order_by(Project.created_at.desc()).all()
    return projects


# ==================== 获取项目详情（验证用户权限）====================

@router.get("/{project_id}", response_model=ProjectDetailResponse)
async def get_project_detail(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 1. 获取项目（验证属于当前用户）
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.creator_id == current_user.id
    ).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # 2. 获取步骤（按 order 排序）
    steps = db.query(ProjectStep).filter(
        ProjectStep.project_id == project_id
    ).order_by(ProjectStep.order).all()
    
    # 3. 为每个步骤获取子步骤
    for step in steps:
        substeps = db.query(ProjectSubstep).filter(
            ProjectSubstep.project_step_id == step.id
        ).order_by(ProjectSubstep.order).all()
        step.substeps = substeps
        
        # 4. 为每个子步骤获取子任务
        for substep in substeps:
            subtasks = db.query(ProjectSubtask).filter(
                ProjectSubtask.project_substep_id == substep.id
            ).order_by(ProjectSubtask.order).all()
            substep.subtasks = subtasks
    
    # 5. 将步骤列表赋值给项目
    project.steps = steps
    
    return project


# ==================== 保存子步骤内容（验证用户权限 + 保存 Stakeholder）====================

@router.post("/{project_id}/substeps/{substep_id}/content", response_model=SubstepContentResponse)
async def save_substep_content(
    project_id: int,
    substep_id: str,
    content: SubstepContentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 验证项目属于当前用户
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.creator_id == current_user.id
    ).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # 通过 code 查找 substep
    substep = db.query(ProjectSubstep).filter(
        ProjectSubstep.code == substep_id,
        ProjectSubstep.project_step_id.in_(
            db.query(ProjectStep.id).filter(ProjectStep.project_id == project_id)
        )
    ).first()
    if not substep:
        raise HTTPException(status_code=404, detail="Substep not found")
    
    # 使用 substep.id（整数主键）关联内容
    db_content = db.query(SubstepContent).filter(
        SubstepContent.project_substep_id == substep.id
    ).first()
    
    if db_content:
        db_content.content_data = content.content_data
        db_content.ui_state = content.ui_state
        db_content.user_id = current_user.id
    else:
        db_content = SubstepContent(
            project_substep_id=substep.id,
            content_data=content.content_data,
            ui_state=content.ui_state,
            user_id=current_user.id
        )
        db.add(db_content)
    
    # 保存 Stakeholder 数据到单独表
    await save_stakeholders(db, project_id, current_user.id, content.content_data)
    
    # 确认调用 save_stakeholders
    await save_stakeholders(db, project_id, current_user.id, content.content_data)
    
    db.commit()
    db.refresh(db_content)
    return db_content


# ==================== 获取子步骤内容（验证用户权限）====================

@router.get("/{project_id}/substeps/{substep_id}/content", response_model=Optional[SubstepContentResponse])
async def get_substep_content(
    project_id: int,
    substep_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 验证项目属于当前用户
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.creator_id == current_user.id
    ).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # 通过 code 查找 substep
    substep = db.query(ProjectSubstep).filter(
        ProjectSubstep.code == substep_id,
        ProjectSubstep.project_step_id.in_(
            db.query(ProjectStep.id).filter(ProjectStep.project_id == project_id)
        )
    ).first()
    
    if not substep:
        return None
    
    # 使用 substep.id（整数主键）查找内容
    content = db.query(SubstepContent).filter(
        SubstepContent.project_substep_id == substep.id
    ).first()
    return content


# ==================== 获取项目的 Stakeholder 列表 ====================

@router.get("/{project_id}/stakeholders", response_model=List[StakeholderListResponse])
async def get_project_stakeholders(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 验证项目属于当前用户（或项目成员，未来扩展）
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.creator_id == current_user.id
    ).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # 获取该项目的所有 stakeholder
    stakeholders = db.query(Stakeholder).filter(
        Stakeholder.project_id == project_id
    ).order_by(Stakeholder.created_at.desc()).all()
    
    return stakeholders
   
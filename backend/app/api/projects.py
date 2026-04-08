# backend/app/api/projects.py

from app.schemas.stakeholder import StakeholderListResponse
from fastapi import APIRouter, Depends, HTTPException, status  # pyright: ignore[reportMissingImports]
from sqlalchemy.orm import Session  # pyright: ignore[reportMissingImports]
from sqlalchemy.sql import func  # pyright: ignore[reportMissingImports]
from typing import List, Optional, Union
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
from app.utils.permissions import can_access_project  # pyright: ignore[reportMissingImports]
from app.utils.websocket_utils import notify_content_saved

router = APIRouter(prefix="/projects", tags=["Projects"])

# ==================== 辅助函数：清理空字段 ====================

def cleanup_empty_fields(data: dict) -> dict:
    """
    递归清理 content_data 中的空字段
    规则：
    - 空字符串 → 删除
    - null → 删除
    - 空字典 → 删除
    - 空列表 → 删除
    """
    if not isinstance(data, dict):
        return data

    cleaned = {}
    for key, value in data.items():
        if isinstance(value, dict):
            # 递归清理嵌套字典
            cleaned_value = cleanup_empty_fields(value)
            # 只保留非空字典
            if cleaned_value:
                cleaned[key] = cleaned_value
        elif isinstance(value, list):
            # 清理列表中的空字典
            cleaned_value = [
                cleanup_empty_fields(item) if isinstance(item, dict) else item
                for item in value
            ]
            # 只保留非空列表
            if cleaned_value:
                cleaned[key] = cleaned_value
        elif value not in (None, '', []):
            # 保留非空值
            cleaned[key] = value

    return cleaned

# ==================== 辅助函数：保存 Stakeholder 数据 ====================

async def save_stakeholders(
    db: Session,
    project_id: int,
    user_id: int,
    content_data: dict
):
    """
    从 content_data 中提取 stakeholder 数据并保存到 stakeholders 表
    """
    # 在函数开始时清理空字段
    content_data = cleanup_empty_fields(content_data)
    
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
        
        if re.match(r'^subtask-.*-stakeholder-role-\d+$', key):
            name = value_stripped
            if name:
                frontend_stakeholders.add(name)
                if name not in stakeholders_data:
                    stakeholders_data[name] = {"roles": []}
        
        elif re.match(r'^subtask-.*-stakeholder-role-\d+-role$', key):
            role_string = value_stripped
            name_key = key[:-5]
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

        existing = db.query(Stakeholder).filter(
            Stakeholder.project_id == project_id,
            Stakeholder.name == name
        ).first()

        if existing:
            existing.roles = unique_roles
            existing.updated_at = func.now()
        else:
            stakeholder = Stakeholder(
                project_id=project_id,
                creator_id=user_id,
                name=name,
                roles=unique_roles,
                is_global=False
            )
            db.add(stakeholder)

    db.commit()

# ==================== 创建项目 ====================

@router.post("/", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project(
    project: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
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

    # 自动添加创建者为项目 owner
    from app.models.member import ProjectMember
    
    membership = ProjectMember(
        project_id=db_project.id,
        user_id=current_user.id,
        role="owner",
    )
    db.add(membership)
    db.commit()

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

# ==================== 获取项目列表 ====================

@router.get("/", response_model=List[ProjectListResponse])
async def get_projects(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 获取用户可访问的所有项目（包括作为成员的项目）
    from app.models.member import ProjectMember
    
    # 获取用户创建的项目
    created_projects = db.query(Project).filter(
        Project.creator_id == current_user.id
    ).order_by(Project.created_at.desc()).all()
    
    # 获取用户作为成员的项目
    memberships = db.query(ProjectMember).filter(
        ProjectMember.user_id == current_user.id
    ).all()
    member_project_ids = [m.project_id for m in memberships]
    
    member_projects = db.query(Project).filter(
        Project.id.in_(member_project_ids)
    ).all() if member_project_ids else []
    
    # 合并并去重
    all_projects = {p.id: p for p in created_projects}.values()
    all_projects = list(all_projects) + [
        p for p in member_projects 
        if p.id not in [cp.id for cp in created_projects]
    ]
    
    return all_projects

# ==================== 获取项目详情 ====================

@router.get("/{project_id}", response_model=ProjectDetailResponse)
async def get_project_detail(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 使用权限函数（支持团队成员访问）
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project or not can_access_project(db, project_id, current_user.id):
        raise HTTPException(status_code=404, detail="Project not found")
    
    # 获取所有 steps
    steps = db.query(ProjectStep).filter(
        ProjectStep.project_id == project_id
    ).order_by(ProjectStep.order).all()

    # 为每个 step 加载 substeps
    for step in steps:
        substeps = db.query(ProjectSubstep).filter(
            ProjectSubstep.project_step_id == step.id
        ).order_by(ProjectSubstep.order).all()
        step.substeps = substeps
        
        # 为每个 substep 加载 subtasks
        for substep in substeps:
            subtasks = db.query(ProjectSubtask).filter(
                ProjectSubtask.project_substep_id == substep.id
            ).order_by(ProjectSubtask.order).all()
            substep.subtasks = subtasks

    project.steps = steps

    return project

# ==================== 保存子步骤内容 ====================

@router.post("/{project_id}/substeps/{substep_id}/content", response_model=SubstepContentResponse)
async def save_substep_content(
    project_id: int,
    substep_id: str,
    content: SubstepContentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 使用权限函数（支持团队成员保存）
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project or not can_access_project(db, project_id, current_user.id):
        raise HTTPException(status_code=404, detail="Project not found")

    substep = db.query(ProjectSubstep).filter(
        ProjectSubstep.code == substep_id,
        ProjectSubstep.project_step_id.in_(
            db.query(ProjectStep.id).filter(ProjectStep.project_id == project_id)
        )
    ).first()
    if not substep:
        raise HTTPException(status_code=404, detail="Substep not found")

    content_data = content.content_data.copy()
    for key, value in content_data.items():
        if key.endswith('-role') and isinstance(value, str):
            roles = [r.strip() for r in value.split(",") if r.strip()]
            content_data[key] = ", ".join(roles[:3])

    # 保存前清理空字段
    content_data = cleanup_empty_fields(content_data)

    db_content = db.query(SubstepContent).filter(
        SubstepContent.project_substep_id == substep.id
    ).first()

    if db_content:
        db_content.content_data = content_data
        db_content.ui_state = content.ui_state
        db_content.user_id = current_user.id
    else:
        db_content = SubstepContent(
            project_substep_id=substep.id,
            content_data=content_data,
            ui_state=content.ui_state,
            user_id=current_user.id
        )
        db.add(db_content)

    await save_stakeholders(db, project_id, current_user.id, content_data)

    db.commit()
    db.refresh(db_content)

    # 推送给同一项目的其他客户端
    await notify_content_saved(
        project_id=project_id,
        substep_id=substep_id,
        content_data={
            "substep_id": substep_id,
            "updated_at": db_content.updated_at.isoformat() if db_content.updated_at else None,
            "user_id": current_user.id,
        }
    )

    return db_content

# ==================== 获取子步骤内容 ====================

@router.get("/{project_id}/substeps/{substep_id}/content", response_model=Optional[SubstepContentResponse])
async def get_substep_content(
    project_id: int,
    substep_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 使用权限函数（支持团队成员查看）
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project or not can_access_project(db, project_id, current_user.id):
        raise HTTPException(status_code=404, detail="Project not found")

    substep = db.query(ProjectSubstep).filter(
        ProjectSubstep.code == substep_id,
        ProjectSubstep.project_step_id.in_(
            db.query(ProjectStep.id).filter(ProjectStep.project_id == project_id)
        )
    ).first()

    if not substep:
        return None

    content = db.query(SubstepContent).filter(
        SubstepContent.project_substep_id == substep.id
    ).first()
    return content

# ==================== 获取项目的 Stakeholder 列表 ====================

@router.get("/{project_id}/stakeholders")
async def get_project_stakeholders(
    project_id: int,
    response_format: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 使用权限函数（支持团队成员访问）
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project or not can_access_project(db, project_id, current_user.id):
        raise HTTPException(status_code=404, detail="Project not found")

    stakeholders = db.query(Stakeholder).filter(
        Stakeholder.project_id == project_id
    ).all()

    if response_format == "roles":
        all_roles = set()
        for s in stakeholders:
            if s.roles:
                for role in s.roles:
                    all_roles.add(role)
        
        return sorted(list(all_roles))
    else:
        return stakeholders
        
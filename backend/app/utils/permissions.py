# backend/app/utils/permissions.py

from sqlalchemy.orm import Session # pyright: ignore[reportMissingImports]
from app.models.member import ProjectMember
from app.models.project import Project
from typing import Optional


def is_project_member(db: Session, project_id: int, user_id: int) -> bool:

    membership = db.query(ProjectMember).filter(
        ProjectMember.project_id == project_id,
        ProjectMember.user_id == user_id
    ).first()
    return membership is not None


def get_project_role(db: Session, project_id: int, user_id: int) -> Optional[str]:

    membership = db.query(ProjectMember).filter(
        ProjectMember.project_id == project_id,
        ProjectMember.user_id == user_id
    ).first()
    return membership.role if membership else None


def is_project_owner_or_admin(db: Session, project_id: int, user_id: int) -> bool:

    role = get_project_role(db, project_id, user_id)
    return role in ["owner", "admin"]


def can_access_project(db: Session, project_id: int, user_id: int) -> bool:

    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        return False
    
    if project.creator_id == user_id:
        return True
    
    return is_project_member(db, project_id, user_id)


def can_edit_comment(comment_author_id: int, current_user_id: int) -> bool:

    return comment_author_id == current_user_id


def can_delete_comment(
    db: Session,
    comment_author_id: int,
    current_user_id: int,
    project_id: int,
    is_reply: bool = False
) -> bool:

    if comment_author_id == current_user_id:
        return True

    if is_reply and is_project_owner_or_admin(db, project_id, current_user_id):
        return True
    
    return False


def can_resolve_comment(db: Session, project_id: int, current_user_id: int) -> bool:

    return is_project_owner_or_admin(db, project_id, current_user_id)

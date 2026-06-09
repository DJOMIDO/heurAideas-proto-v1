# backend/app/api/members.py

from fastapi import ( # pyright: ignore[reportMissingImports]
    APIRouter,
    Depends,
    HTTPException,
    status,
)  # pyright: ignore[reportMissingImports]
from sqlalchemy.orm import Session  # pyright: ignore[reportMissingImports]
from typing import List
from app.database import get_db
from app.models.member import ProjectMember
from app.models.project import Project
from app.models.user import User
from app.schemas.member import (
    MemberCreate,
    MemberResponse,
    MemberListResponse,
    MemberAddResponse,
    ROLE_DESCRIPTIONS,
)
from app.api.auth import get_current_user
from app.utils.permissions import (
    is_project_owner_or_admin,
    can_access_project,
)
from app.websocket.manager import manager
from datetime import datetime

router = APIRouter(prefix="/projects/{project_id}/members", tags=["Members"])

# ==================== Get project members ====================


@router.get("/", response_model=MemberListResponse)
async def get_project_members(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get project members"""
    # Ensure project exists and user has access
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project or not can_access_project(db, project_id, current_user.id):
        raise HTTPException(status_code=404, detail="Project not found")

    # Query project memberships
    memberships = (
        db.query(ProjectMember).filter(ProjectMember.project_id == project_id).all()
    )

    # Construct member response with user info
    members = []
    for membership in memberships:
        user = db.query(User).filter(User.id == membership.user_id).first()
        if user:
            members.append(
                MemberResponse(
                    id=membership.id,
                    project_id=membership.project_id,
                    user_id=membership.user_id,
                    role=membership.role,
                    business_role=membership.business_role,
                    joined_at=membership.joined_at,
                    user_email=user.email,
                    user_username=user.username,
                )
            )

    return MemberListResponse(total=len(members), members=members)


# ==================== Add project member ====================


@router.post("/", response_model=MemberAddResponse)
async def add_project_member(
    project_id: int,
    member_data: MemberCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Add project member (only owner/admin can do this)"""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if not is_project_owner_or_admin(db, project_id, current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only project owner or admin can add members",
        )

    # query user with provided user_id
    new_member = db.query(User).filter(User.id == member_data.user_id).first()
    if not new_member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    existing = (
        db.query(ProjectMember)
        .filter(
            ProjectMember.project_id == project_id,
            ProjectMember.user_id == new_member.id,
        )
        .first()
    )

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is already a member of this project",
        )

    if member_data.role == "owner":
        existing_owner = (
            db.query(ProjectMember)
            .filter(
                ProjectMember.project_id == project_id, ProjectMember.role == "owner"
            )
            .first()
        )
        if existing_owner:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Project already has an owner",
            )

    membership = ProjectMember(
        project_id=project_id,
        user_id=new_member.id,
        role=member_data.role or "member",
        business_role=member_data.business_role,
    )
    db.add(membership)
    db.commit()
    db.refresh(membership)

    # Notify the new member via WebSocket (if connected)
    try:
        await manager.send_to_user(
            user_id=new_member.id,
            message={
                "type": "project_added",
                "project_id": project_id,
                "project_name": project.name,
                "invited_by": current_user.username,
                "timestamp": datetime.utcnow().isoformat(),
            },
        )
    except Exception as e:
        # Log the error but don't fail the request if notification fails
        print(f"[WS Warning] Failed to notify user {new_member.id}: {e}")

    return MemberAddResponse(
        project_id=project_id,
        user_id=new_member.id,
        role=membership.role,
        message=f"User {new_member.username} added as {membership.role}",
    )


# ==================== Update member role ====================


@router.put("/{user_id}/role")
async def update_member_role(
    project_id: int,
    user_id: int,
    role: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update member role (only owner can do this)"""
    # Ensure project exists
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Verify permissions (only owner can update roles)
    current_role = (
        db.query(ProjectMember)
        .filter(
            ProjectMember.project_id == project_id,
            ProjectMember.user_id == current_user.id,
        )
        .first()
    )

    if not current_role or current_role.role != "owner":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only project owner can update member roles",
        )

    # Validate role
    if role not in ["owner", "admin", "member"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid role. Must be owner, admin, or member",
        )

    # If setting role to owner, ensure there isn't already another owner (except the current user)
    if role == "owner":
        existing_owner = (
            db.query(ProjectMember)
            .filter(
                ProjectMember.project_id == project_id,
                ProjectMember.role == "owner",
                ProjectMember.user_id != user_id,
            )
            .first()
        )
        if existing_owner:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Project already has an owner",
            )

    # Update member role
    membership = (
        db.query(ProjectMember)
        .filter(
            ProjectMember.project_id == project_id, ProjectMember.user_id == user_id
        )
        .first()
    )

    if not membership:
        raise HTTPException(status_code=404, detail="Member not found")

    membership.role = role
    db.commit()

    return {"message": f"Role updated to {role}"}


# ==================== Remove project member ====================


@router.delete("/{user_id}")
async def remove_project_member(
    project_id: int,
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Remove project member (only owner/admin can do this)"""
    # Ensure project exists
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Verify permissions (only owner/admin can remove members)
    if not is_project_owner_or_admin(db, project_id, current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only project owner or admin can remove members",
        )

    # Check if the target membership exists and is not the owner (cannot remove owner)
    target_membership = (
        db.query(ProjectMember)
        .filter(
            ProjectMember.project_id == project_id, ProjectMember.user_id == user_id
        )
        .first()
    )

    if not target_membership:
        raise HTTPException(status_code=404, detail="Member not found")

    if target_membership.role == "owner":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot remove project owner",
        )

    # Delete the membership
    db.query(ProjectMember).filter(
        ProjectMember.project_id == project_id, ProjectMember.user_id == user_id
    ).delete()
    db.commit()

    return {"message": "Member removed"}


# ==================== Get available roles ====================


@router.get("/roles")
async def get_available_roles():
    """Get available project role list"""
    return [
        {"role": role, "description": desc} for role, desc in ROLE_DESCRIPTIONS.items()
    ]

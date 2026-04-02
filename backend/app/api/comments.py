# backend/app/api/comments.py

from fastapi import APIRouter, Depends, HTTPException, status, Query # pyright: ignore[reportMissingImports]
from sqlalchemy.orm import Session # pyright: ignore[reportMissingImports]
from sqlalchemy import func # pyright: ignore[reportMissingImports]
from typing import List, Optional
from app.database import get_db
from app.models.comment import Comment
from app.models.project import Project, ProjectStep, ProjectSubstep, ProjectSubtask
from app.models.user import User
from app.schemas.comment import (
    CommentCreate,
    CommentUpdate,
    CommentResponse,
    CommentListResponse,
    CommentCountResponse,
)
from app.api.auth import get_current_user
# 导入权限函数
from app.utils.permissions import (
    can_access_project,
    can_edit_comment,
    can_delete_comment,
    can_resolve_comment,
)

router = APIRouter(prefix="/comments", tags=["Comments"])

# ==================== 辅助函数 ====================

def get_subtask_code(db: Session, project_subtask_id: Optional[int]) -> Optional[str]:
    if not project_subtask_id:
        return None
    subtask = db.query(ProjectSubtask).filter(
        ProjectSubtask.id == project_subtask_id
    ).first()
    return subtask.code if subtask else None

def build_comment_dict(comment: Comment, db: Session) -> dict:
    return {
        "id": comment.id,
        "content": comment.content,
        "position_x": comment.position_x,
        "position_y": comment.position_y,
        "anchor_type": comment.anchor_type,
        "anchor_id": comment.anchor_id,
        "project_id": comment.project_id,
        "project_step_id": comment.project_step_id,
        "project_substep_id": comment.project_substep_id,
        "project_subtask_id": comment.project_subtask_id,
        "project_subtask_code": get_subtask_code(db, comment.project_subtask_id),
        "parent_id": comment.parent_id,
        "author_id": comment.author_id,
        "author_name": comment.author_name,
        "is_resolved": comment.is_resolved,
        "is_deleted": comment.is_deleted,
        "is_edited": comment.is_edited,
        "created_at": comment.created_at,
        "updated_at": comment.updated_at,
        "replies": [],
    }

def build_comment_tree(comment: Comment, db: Session, depth: int = 0, max_depth: int = 3) -> dict:
    comment_dict = build_comment_dict(comment, db)
    if depth < max_depth:
        replies = db.query(Comment).filter(
            Comment.parent_id == comment.id,
            Comment.is_deleted == False
        ).order_by(Comment.created_at.asc()).all()
        
        for reply in replies:
            reply_dict = build_comment_tree(reply, db, depth + 1, max_depth)
            comment_dict["replies"].append(reply_dict)
    return comment_dict

# ==================== 获取评论列表 ====================

@router.get("/project/{project_id}", response_model=CommentListResponse)
async def get_project_comments(
    project_id: int,
    substep_id: Optional[str] = Query(default=None),
    subtask_id: Optional[str] = Query(default=None),
    include_resolved: bool = Query(default=True),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """获取项目的所有评论"""
    # ✅ 修改：使用权限函数
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project or not can_access_project(db, project_id, current_user.id):
        raise HTTPException(status_code=404, detail="Project not found")

    query = db.query(Comment).filter(
        Comment.project_id == project_id,
        Comment.is_deleted == False
    )

    if substep_id:
        substep = db.query(ProjectSubstep).filter(
            ProjectSubstep.code == substep_id,
            ProjectSubstep.project_step_id.in_(
                db.query(ProjectStep.id).filter(ProjectStep.project_id == project_id)
            )
        ).first()
        if substep:
            query = query.filter(Comment.project_substep_id == substep.id)

    if subtask_id:
        subtask = db.query(ProjectSubtask).filter(
            ProjectSubtask.code == subtask_id,
            ProjectSubtask.project_substep_id.in_(
                db.query(ProjectSubstep.id).filter(
                    ProjectSubstep.project_step_id.in_(
                        db.query(ProjectStep.id).filter(ProjectStep.project_id == project_id)
                    )
                )
            )
        ).first()
        if subtask:
            query = query.filter(Comment.project_subtask_id == subtask.id)

    if not include_resolved:
        query = query.filter(Comment.is_resolved == False)

    comments = query.filter(Comment.parent_id == None).order_by(Comment.created_at.desc()).all()

    comments_with_code = []
    for comment in comments:
        comment_dict = build_comment_dict(comment, db)
        comments_with_code.append(comment_dict)

    total = query.count()
    resolved_count = query.filter(Comment.is_resolved == True).count()

    return CommentListResponse(
        total=total,
        comments=comments_with_code,
        resolved_count=resolved_count,
        unresolved_count=total - resolved_count
    )

# ==================== 获取子步骤评论 ====================

@router.get("/substep/{substep_id}", response_model=CommentListResponse)
async def get_substep_comments(
    substep_id: str,
    project_id: int,
    include_resolved: bool = Query(default=True),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """获取指定子步骤的所有评论"""
    # ✅ 修改：使用权限函数
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

    query = db.query(Comment).filter(
        Comment.project_substep_id == substep.id,
        Comment.is_deleted == False,
        Comment.parent_id == None
    )

    if not include_resolved:
        query = query.filter(Comment.is_resolved == False)

    comments = query.order_by(Comment.created_at.desc()).all()

    comments_with_code = []
    for comment in comments:
        comment_dict = build_comment_tree(comment, db, depth=0, max_depth=3)
        comments_with_code.append(comment_dict)

    total = query.count()
    resolved_count = query.filter(Comment.is_resolved == True).count()

    return CommentListResponse(
        total=total,
        comments=comments_with_code,
        resolved_count=resolved_count,
        unresolved_count=total - resolved_count
    )

# ==================== 创建评论 ====================

@router.post("/", response_model=CommentResponse, status_code=status.HTTP_201_CREATED)
async def create_comment(
    comment: CommentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """创建新评论或回复"""
    # ✅ 修改：使用权限函数
    project = db.query(Project).filter(Project.id == comment.project_id).first()
    if not project or not can_access_project(db, comment.project_id, current_user.id):
        raise HTTPException(status_code=404, detail="Project not found")

    substep = db.query(ProjectSubstep).filter(
        ProjectSubstep.id == comment.project_substep_id
    ).first()
    if not substep:
        raise HTTPException(status_code=404, detail="Substep not found")

    project_subtask_id = None
    if comment.project_subtask_code:
        subtask = db.query(ProjectSubtask).filter(
            ProjectSubtask.code == comment.project_subtask_code,
            ProjectSubtask.project_substep_id == comment.project_substep_id
        ).first()
        if subtask:
            project_subtask_id = subtask.id

    if comment.parent_id:
        parent_comment = db.query(Comment).filter(
            Comment.id == comment.parent_id,
            Comment.is_deleted == False
        ).first()
        if not parent_comment:
            raise HTTPException(status_code=404, detail="Parent comment not found")

    db_comment = Comment(
        project_id=comment.project_id,
        project_step_id=comment.project_step_id,
        project_substep_id=comment.project_substep_id,
        project_subtask_id=project_subtask_id,
        position_x=comment.position_x,
        position_y=comment.position_y,
        anchor_type=comment.anchor_type,
        anchor_id=comment.anchor_id,
        content=comment.content,
        parent_id=comment.parent_id,
        author_id=current_user.id,
        author_name=current_user.username,
        is_resolved=False,
        is_deleted=False,
        is_edited=False,
    )

    db.add(db_comment)
    db.commit()
    db.refresh(db_comment)

    return db_comment

# ==================== 获取评论详情 ====================

@router.get("/{comment_id}", response_model=CommentResponse)
async def get_comment(
    comment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """获取评论详情"""
    comment = db.query(Comment).filter(
        Comment.id == comment_id,
        Comment.is_deleted == False
    ).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")

    # ✅ 修改：使用权限函数
    project = db.query(Project).filter(Project.id == comment.project_id).first()
    if not project or not can_access_project(db, comment.project_id, current_user.id):
        raise HTTPException(status_code=404, detail="Project not found")

    return build_comment_dict(comment, db)

# ==================== 更新评论 ====================

@router.put("/{comment_id}", response_model=CommentResponse)
async def update_comment(
    comment_id: int,
    comment_update: CommentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """更新评论"""
    comment = db.query(Comment).filter(
        Comment.id == comment_id,
        Comment.is_deleted == False
    ).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")

    # ✅ 保持不变：只有作者可以编辑
    if not can_edit_comment(comment.author_id, current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the author can update this comment"
        )

    update_data = comment_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        if value is not None:
            setattr(comment, field, value)

    if update_data.get("content"):
        comment.is_edited = True

    comment.updated_at = func.now()

    db.commit()
    db.refresh(comment)

    return comment

# ==================== 删除评论 ====================

@router.delete("/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_comment(
    comment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """删除评论"""
    comment = db.query(Comment).filter(
        Comment.id == comment_id,
        Comment.is_deleted == False
    ).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")

    # ✅ 修改：使用权限函数（作者 + owner/admin 可删除回复）
    is_reply = comment.parent_id is not None
    if not can_delete_comment(db, comment.author_id, current_user.id, comment.project_id, is_reply):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to delete this comment"
        )

    comment.is_deleted = True
    comment.deleted_at = func.now()

    db.commit()

# ==================== 标记为已解决 ====================

@router.post("/{comment_id}/resolve", response_model=CommentResponse)
async def resolve_comment(
    comment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """标记评论为已解决"""
    comment = db.query(Comment).filter(
        Comment.id == comment_id,
        Comment.is_deleted == False
    ).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")

    # ✅ 修改：只有 owner/admin 可以 resolve
    if not can_resolve_comment(db, comment.project_id, current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only project owner or admin can resolve comments"
        )

    comment.is_resolved = True
    comment.updated_at = func.now()

    db.commit()
    db.refresh(comment)

    return comment

# ==================== 标记为未解决 ====================

@router.post("/{comment_id}/unresolve", response_model=CommentResponse)
async def unresolve_comment(
    comment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """标记评论为未解决"""
    comment = db.query(Comment).filter(
        Comment.id == comment_id,
        Comment.is_deleted == False
    ).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")

    # ✅ 修改：只有 owner/admin 可以 unresolve
    if not can_resolve_comment(db, comment.project_id, current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only project owner or admin can resolve comments"
        )

    comment.is_resolved = False
    comment.updated_at = func.now()

    db.commit()
    db.refresh(comment)

    return comment

# ==================== 获取评论统计 ====================

@router.get("/project/{project_id}/count", response_model=CommentCountResponse)
async def get_comment_count(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """获取项目评论统计"""
    # ✅ 修改：使用权限函数
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project or not can_access_project(db, project_id, current_user.id):
        raise HTTPException(status_code=404, detail="Project not found")

    total = db.query(Comment).filter(
        Comment.project_id == project_id,
        Comment.is_deleted == False
    ).count()

    resolved = db.query(Comment).filter(
        Comment.project_id == project_id,
        Comment.is_deleted == False,
        Comment.is_resolved == True
    ).count()

    substep_counts = db.query(
        ProjectSubstep.code,
        func.count(Comment.id).label("count")
    ).join(
        Comment, Comment.project_substep_id == ProjectSubstep.id
    ).filter(
        ProjectSubstep.project_step_id.in_(
            db.query(ProjectStep.id).filter(ProjectStep.project_id == project_id)
        ),
        Comment.is_deleted == False
    ).group_by(ProjectSubstep.code).all()

    by_substep = {code: count for code, count in substep_counts}

    return CommentCountResponse(
        total=total,
        resolved=resolved,
        unresolved=total - resolved,
        by_substep=by_substep
    )

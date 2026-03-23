# backend/app/api/comments.py

from fastapi import APIRouter, Depends, HTTPException, status, Query  # pyright: ignore[reportMissingImports]
from sqlalchemy.orm import Session  # pyright: ignore[reportMissingImports]
from sqlalchemy import func  # pyright: ignore[reportMissingImports]
from sqlalchemy.orm import joinedload # pyright: ignore[reportMissingImports]
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

router = APIRouter(prefix="/comments", tags=["Comments"])


# ==================== 获取评论列表 ====================

@router.get("/project/{project_id}", response_model=CommentListResponse)
async def get_project_comments(
    project_id: int,
    substep_id: Optional[str] = Query(default=None, description="Filter by substep code (e.g., '1.1')"),
    subtask_id: Optional[str] = Query(default=None, description="Filter by subtask code (e.g., 'a')"),
    include_resolved: bool = Query(default=True, description="Include resolved comments"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """获取项目的所有评论"""
    # 验证项目权限
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.creator_id == current_user.id
    ).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # 基础查询
    query = db.query(Comment).filter(
        Comment.project_id == project_id,
        Comment.is_deleted == False
    )
    
    # 筛选 substep
    if substep_id:
        substep = db.query(ProjectSubstep).filter(
            ProjectSubstep.code == substep_id,
            ProjectSubstep.project_step_id.in_(
                db.query(ProjectStep.id).filter(ProjectStep.project_id == project_id)
            )
        ).first()
        if substep:
            query = query.filter(Comment.project_substep_id == substep.id)
    
    # 筛选 subtask
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
    
    # 筛选 resolved
    if not include_resolved:
        query = query.filter(Comment.is_resolved == False)
    
    # 只获取顶级评论（parent_id 为 NULL）
    comments = query.filter(Comment.parent_id == None).order_by(Comment.created_at.desc()).all()
    
    # 手动添加 project_subtask_code 到每个评论
    comments_with_code = []
    for comment in comments:
        comment_dict = {
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
            "project_subtask_code": None,
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
        
        # 查找 subtask code
        if comment.project_subtask_id:
            subtask = db.query(ProjectSubtask).filter(
                ProjectSubtask.id == comment.project_subtask_id
            ).first()
            if subtask:
                comment_dict["project_subtask_code"] = subtask.code
        
        comments_with_code.append(comment_dict)
    
    # 统计
    total = query.count()
    resolved_count = query.filter(Comment.is_resolved == True).count()
    unresolved_count = total - resolved_count
    
    return CommentListResponse(
        total=total,
        comments=comments_with_code,
        resolved_count=resolved_count,
        unresolved_count=unresolved_count
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
    # 验证项目权限
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.creator_id == current_user.id
    ).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # 查找 substep
    substep = db.query(ProjectSubstep).filter(
        ProjectSubstep.code == substep_id,
        ProjectSubstep.project_step_id.in_(
            db.query(ProjectStep.id).filter(ProjectStep.project_id == project_id)
        )
    ).first()
    if not substep:
        raise HTTPException(status_code=404, detail="Substep not found")
    
    # 查询评论
    query = db.query(Comment).filter(
        Comment.project_substep_id == substep.id,
        Comment.is_deleted == False,
        Comment.parent_id == None  # 只获取顶级评论
    )
    
    if not include_resolved:
        query = query.filter(Comment.is_resolved == False)
    
    # 使用 joinedload 预加载回复
    comments = query.options(
        joinedload(Comment.replies)
    ).order_by(Comment.created_at.desc()).all()
    
    # 手动添加 project_subtask_code 到每个评论（包含回复）
    comments_with_code = []
    for comment in comments:
        comment_dict = {
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
            "project_subtask_code": None,
            "parent_id": comment.parent_id,
            "author_id": comment.author_id,
            "author_name": comment.author_name,
            "is_resolved": comment.is_resolved,
            "is_deleted": comment.is_deleted,
            "is_edited": comment.is_edited,
            "created_at": comment.created_at,
            "updated_at": comment.updated_at,
            "replies": [],  # 初始化回复数组
        }
        
        # 查找 subtask code
        if comment.project_subtask_id:
            subtask = db.query(ProjectSubtask).filter(
                ProjectSubtask.id == comment.project_subtask_id
            ).first()
            if subtask:
                comment_dict["project_subtask_code"] = subtask.code

        # 添加回复（如果有）
        if comment.replies:
            for reply in comment.replies:
                reply_dict = {
                    "id": reply.id,
                    "content": reply.content,
                    "position_x": reply.position_x,
                    "position_y": reply.position_y,
                    "anchor_type": reply.anchor_type,
                    "anchor_id": reply.anchor_id,
                    "project_id": reply.project_id,
                    "project_step_id": reply.project_step_id,
                    "project_substep_id": reply.project_substep_id,
                    "project_subtask_id": reply.project_subtask_id,
                    "project_subtask_code": None,
                    "parent_id": comment.id,  # 必须是 comment.id（父评论 ID）
                    "author_id": reply.author_id,
                    "author_name": reply.author_name,
                    "is_resolved": reply.is_resolved,
                    "is_deleted": reply.is_deleted,
                    "is_edited": reply.is_edited,
                    "created_at": reply.created_at,
                    "updated_at": reply.updated_at,
                    "replies": [],
                }
                
                if reply.project_subtask_id:
                    subtask = db.query(ProjectSubtask).filter(
                        ProjectSubtask.id == reply.project_subtask_id
                    ).first()
                    if subtask:
                        reply_dict["project_subtask_code"] = subtask.code
                
                comment_dict["replies"].append(reply_dict)
        
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
    # 验证项目权限
    project = db.query(Project).filter(
        Project.id == comment.project_id,
        Project.creator_id == current_user.id
    ).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # 验证 substep 存在
    substep = db.query(ProjectSubstep).filter(
        ProjectSubstep.id == comment.project_substep_id
    ).first()
    if not substep:
        raise HTTPException(status_code=404, detail="Substep not found")
    
    # 根据 project_subtask_code 查找 subtask ID
    project_subtask_id = None
    if comment.project_subtask_code:
        subtask = db.query(ProjectSubtask).filter(
            ProjectSubtask.code == comment.project_subtask_code,
            ProjectSubtask.project_substep_id == comment.project_substep_id
        ).first()
        if subtask:
            project_subtask_id = subtask.id
    
    # 验证 parent 评论存在（如果是回复）
    if comment.parent_id:
        parent_comment = db.query(Comment).filter(
            Comment.id == comment.parent_id,
            Comment.is_deleted == False
        ).first()
        if not parent_comment:
            raise HTTPException(status_code=404, detail="Parent comment not found")
    
    # 创建评论
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
    """获取评论详情（包含回复）"""
    comment = db.query(Comment).filter(
        Comment.id == comment_id,
        Comment.is_deleted == False
    ).first()
    
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    
    # 验证项目权限
    project = db.query(Project).filter(
        Project.id == comment.project_id,
        Project.creator_id == current_user.id
    ).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # 手动添加 project_subtask_code
    comment_dict = {
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
        "project_subtask_code": None,
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
    
    if comment.project_subtask_id:
        subtask = db.query(ProjectSubtask).filter(
            ProjectSubtask.id == comment.project_subtask_id
        ).first()
        if subtask:
            comment_dict["project_subtask_code"] = subtask.code
    
    return comment_dict


# ==================== 更新评论 ====================

@router.put("/{comment_id}", response_model=CommentResponse)
async def update_comment(
    comment_id: int,
    comment_update: CommentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """更新评论（仅作者可更新）"""
    comment = db.query(Comment).filter(
        Comment.id == comment_id,
        Comment.is_deleted == False
    ).first()
    
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    
    # 验证权限（只有作者可以更新）
    if comment.author_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the author can update this comment"
        )
    
    # 更新字段
    update_data = comment_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        if value is not None:
            setattr(comment, field, value)
    
    # 标记为已编辑
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
    comment = db.query(Comment).filter(
        Comment.id == comment_id,
        Comment.is_deleted == False
    ).first()
    
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    
    if comment.author_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the author can delete this comment"
        )
    
    # 软删除
    comment.is_deleted = True
    comment.deleted_at = func.now()
    
    db.commit()  # 确保提交


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
    
    # 验证项目权限（项目成员都可以标记为解决）
    project = db.query(Project).filter(
        Project.id == comment.project_id,
        Project.creator_id == current_user.id
    ).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
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
    
    project = db.query(Project).filter(
        Project.id == comment.project_id,
        Project.creator_id == current_user.id
    ).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
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
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.creator_id == current_user.id
    ).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # 总评论数
    total = db.query(Comment).filter(
        Comment.project_id == project_id,
        Comment.is_deleted == False
    ).count()
    
    # 已解决/未解决
    resolved = db.query(Comment).filter(
        Comment.project_id == project_id,
        Comment.is_deleted == False,
        Comment.is_resolved == True
    ).count()
    
    # 按 substep 统计
    from sqlalchemy import distinct # pyright: ignore[reportMissingImports]
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

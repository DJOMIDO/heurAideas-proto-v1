# backend/app/utils/websocket_utils.py
from datetime import datetime
from typing import Optional
from app.websocket.manager import manager

async def notify_comment_added(project_id: int, comment_data: dict):
    await manager.broadcast(project_id, {
        "type": "comment_added",
        "data": comment_data
    })

async def notify_comment_updated(project_id: int, comment_data: dict):
    await manager.broadcast(project_id, {
        "type": "comment_updated",
        "data": comment_data
    })

async def notify_comment_deleted(project_id: int, comment_id: int):
    await manager.broadcast(project_id, {
        "type": "comment_deleted",
        "comment_id": comment_id
    })

async def notify_content_saved(project_id: int, substep_id: str, content_data: dict):
    await manager.broadcast(project_id, {
        "type": "content_saved",
        "substep_id": substep_id,
        "data": content_data
    })

async def notify_user_typing(
    project_id: int, 
    substep_id: str, 
    field: str, 
    user_id: int, 
    username: str,
    exclude_user_id: Optional[int] = None
):
    """通知其他用户某人正在编辑"""
    await manager.broadcast(
        project_id, 
        {
            "type": "user_typing",
            "substep_id": substep_id,
            "field": field,
            "user_id": user_id,
            "username": username,
            "timestamp": datetime.now().isoformat()
        },
        exclude_user_id=exclude_user_id
    )
    
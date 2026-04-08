# backend/app/api/websocket.py

from fastapi import APIRouter, WebSocket, WebSocketDisconnect # pyright: ignore[reportMissingImports]
from app.websocket.manager import manager
from app.core.security import decode_access_token
from app.utils.typing_tracker import typing_tracker
from app.utils.websocket_utils import notify_user_typing
import json

router = APIRouter(tags=["WebSocket"])

@router.websocket("/ws/{project_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    project_id: int,
    token: str = None  # 从 query parameter 获取 token
):
    """
    WebSocket 连接端点
    
    认证方式（开发环境）：
    - token 作为 query parameter: /ws/1?token=xxx
    """
    # 开发环境：简化认证（生产环境请启用完整验证）
    user_id = None
    username = "guest"
    
    if token:
        try:
            payload = decode_access_token(token)
            user_id = payload.get("user_id")
            username = payload.get("sub", "guest")
        except Exception:
            # Token 无效，关闭连接
            await websocket.close(code=1008)  # Policy violation
            return
    
    # 接受连接
    await manager.connect(websocket, project_id)
    
    # 发送连接成功消息
    await manager.send_personal(websocket, {
        "type": "connected",
        "user_id": user_id,
        "username": username,
        "project_id": project_id
    })
    
    try:
        while True:
            # 接收客户端消息（可选：心跳检测等）
            data = await websocket.receive_text()
            try:
                message = json.loads(data)
                # 处理编辑状态消息
                if message.get("type") == "user_typing":
                    substep_id = message.get("substep_id")
                    field = message.get("field")
                    msg_user_id = message.get("user_id")
                    msg_username = message.get("username")
                    
                    if substep_id and field and msg_user_id and msg_username:
                        # 追踪编辑状态
                        typing_tracker.start_typing(
                            project_id, substep_id, field, msg_user_id, msg_username
                        )
                        
                        # 推送给其他客户端
                        await notify_user_typing(
                            project_id, substep_id, field, msg_user_id, msg_username
                        )
                
                # 处理停止编辑消息
                elif message.get("type") == "stop_typing":
                    substep_id = message.get("substep_id")
                    field = message.get("field")
                    if substep_id and field:
                        typing_tracker.stop_typing(project_id, substep_id, field)
                
                # 原有 ack 逻辑保持不变
                await manager.send_personal(websocket, {
                    "type": "ack",
                    "message": "Received"
                })
            except json.JSONDecodeError:
                pass
    except WebSocketDisconnect:
        manager.disconnect(websocket, project_id)
    except Exception as e:
        print(f"WebSocket error: {e}")
        manager.disconnect(websocket, project_id)
        
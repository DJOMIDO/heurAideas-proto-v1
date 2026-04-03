# backend/app/api/websocket.py

from fastapi import APIRouter, WebSocket, WebSocketDisconnect # pyright: ignore[reportMissingImports]
from app.websocket.manager import manager
from app.core.security import decode_access_token
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
                # 可以处理客户端消息
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
        
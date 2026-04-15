# backend/app/api/websocket.py

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query # pyright: ignore[reportMissingImports]
from app.websocket.manager import manager
from app.core.security import decode_access_token
from app.utils.typing_tracker import typing_tracker
from app.utils.websocket_utils import notify_user_typing
import json
import logging
import sys

logger = logging.getLogger(__name__)

router = APIRouter(tags=["WebSocket"])

@router.websocket("/ws/{project_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    project_id: int,
    token: str = Query(None)
):
    user_id = None
    username = "guest"
    
    # 1. 验证 Token
    if token:
        try:
            payload = decode_access_token(token)
            user_id = payload.get("user_id")
            username = payload.get("sub", "guest")
            
            if not user_id:
                logger.warning("Token valid but no user_id found")
                await websocket.close(code=1008, reason="Invalid token payload")
                return
                
        except Exception as e:
            logger.error(f"Token validation failed: {e}")
            await websocket.close(code=1008, reason="Invalid token")
            return
    else:
        logger.warning("No token provided for WebSocket connection")

    # 2. 建立连接
    connected = await manager.connect(websocket, project_id, user_id)
    if not connected:
        await websocket.close(code=1011, reason="Connection failed")
        return
    
    # 【调试日志】强制打印连接成功
    print(f"✅ [WS] CONNECTED: User={username}(ID:{user_id}) to Project={project_id}", flush=True)
    logger.info(f"WebSocket session started for {username} (ID: {user_id}) in project {project_id}")

    try:
        while True:
            data = await websocket.receive_text()
            try:
                message = json.loads(data)
                msg_type = message.get("type")
                
                # 处理编辑状态消息
                if msg_type == "user_typing":
                    substep_id = message.get("substep_id")
                    field = message.get("field")
                    msg_user_id = message.get("user_id")
                    # ⚠️ 关键修复：不再依赖前端传来的 username，直接使用从 Token 解析的 username
                    # 前端传来的 msg_username 可能是空的，导致下面的 if 判断失败
                    
                    if substep_id and field and msg_user_id:
                        # 【调试日志】收到打字消息
                        print(f"👆 [WS] TYPING DETECTED: User={username} on Field={field} in Substep={substep_id}", flush=True)

                        # 追踪编辑状态
                        typing_tracker.start_typing(
                            project_id, substep_id, field, msg_user_id, username
                        )
                        
                        # 推送给其他客户端
                        # 使用从 Token 解析的 username，确保非空
                        await notify_user_typing(
                            project_id, substep_id, field, msg_user_id, username,
                            exclude_user_id=user_id
                        )
                        print(f"📢 [WS] BROADCASTING typing status for {username}...", flush=True)
                    else:
                        print(f"⚠️ [WS] TYPING IGNORED: Missing fields. substep_id={substep_id}, field={field}, user_id={msg_user_id}", flush=True)
                
                # 处理停止编辑消息
                elif msg_type == "stop_typing":
                    substep_id = message.get("substep_id")
                    field = message.get("field")
                    if substep_id and field:
                        typing_tracker.stop_typing(project_id, substep_id, field)
                
            except json.JSONDecodeError:
                logger.error(f"Invalid JSON received: {data}")
            except Exception as e:
                logger.error(f"Error processing message: {e}")
                
    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected normally: {username}")
        print(f"❌ [WS] DISCONNECTED: User={username}", flush=True)
    except Exception as e:
        logger.error(f"WebSocket error for {username}: {e}")
        print(f"💥 [WS] ERROR: {e}", flush=True)
    finally:
        manager.disconnect(websocket)
        
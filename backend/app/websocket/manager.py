# backend/app/websocket/manager.py

from fastapi import WebSocket # pyright: ignore[reportMissingImports]
from typing import List, Dict, Optional
import logging

logger = logging.getLogger(__name__)

class ConnectionManager:
    """WebSocket 连接管理器 - 增强版"""
    
    def __init__(self):
        # 存储连接：{project_id: {user_id: websocket}}
        self.active_connections: Dict[int, Dict[int, WebSocket]] = {}
        # 反向索引：{websocket: (project_id, user_id)}
        self.connection_map: Dict[WebSocket, tuple] = {}
    
    async def connect(self, websocket: WebSocket, project_id: int, user_id: int) -> bool:
        """接受连接并存储。如果用户已存在，直接替换旧连接（避免主动关闭导致的竞态）"""
        try:
            await websocket.accept()
            
            if project_id not in self.active_connections:
                self.active_connections[project_id] = {}
            
            # 如果该用户已有连接，直接替换引用，不再主动关闭旧连接
            # 旧连接会因为客户端或网络超时而自然断开，触发 disconnect 清理
            if user_id in self.active_connections[project_id]:
                old_ws = self.active_connections[project_id][user_id]
                logger.warning(f"User {user_id} reconnected to project {project_id}. Replacing old connection.")
                # 移除旧连接的反向索引，防止 disconnect 时误删新连接
                self.connection_map.pop(old_ws, None)
            
            # 存储新连接
            self.active_connections[project_id][user_id] = websocket
            self.connection_map[websocket] = (project_id, user_id)
            
            logger.info(f"WebSocket connected: user_id={user_id}, project_id={project_id}")
            return True
        except Exception as e:
            logger.error(f"Failed to accept WebSocket connection: {e}")
            return False
    
    def disconnect(self, websocket: WebSocket):
        """断开连接并移除"""
        info = self.connection_map.pop(websocket, None)
        if info:
            project_id, user_id = info
            
            if project_id in self.active_connections:
                # 确保只删除当前 websocket 对应的用户
                if self.active_connections[project_id].get(user_id) == websocket:
                    del self.active_connections[project_id][user_id]
                    
                    # 如果项目没有连接了，清理项目条目
                    if not self.active_connections[project_id]:
                        del self.active_connections[project_id]
                
                logger.info(f"WebSocket disconnected: user_id={user_id}, project_id={project_id}")
        else:
            # 这种情况通常是因为重复连接时已经移除了旧索引，属于正常现象，降级为 debug 日志
            logger.debug("Disconnect called for unknown or already replaced websocket")
    
    async def broadcast(self, project_id: int, message: dict, exclude_user_id: Optional[int] = None):
        """向项目的所有连接广播消息"""
        if project_id not in self.active_connections:
            logger.warning(f"Broadcast failed: Project {project_id} has no active connections.")
            return
        
        connections_to_send = []
        target_users = []
        
        for uid, ws in list(self.active_connections[project_id].items()):
            if exclude_user_id is not None and uid == exclude_user_id:
                continue
            
            if hasattr(ws, 'client_state') and ws.client_state.value == 1:
                connections_to_send.append((uid, ws))
                target_users.append(uid)
            else:
                logger.warning(f"Broadcast: Found stale connection for user {uid}. Cleaning up.")
                self.disconnect(ws)
        
        msg_type = message.get('type', 'unknown')
        logger.info(f"Broadcasting message type='{msg_type}' to project {project_id}. Targets: {target_users}, Excluded: {exclude_user_id}")
        
        if not connections_to_send:
            logger.debug(f"Broadcast: No active connections to send to in project {project_id}.")
            return

        for uid, ws in connections_to_send:
            try:
                await ws.send_json(message)
            except Exception as e:
                logger.error(f"Broadcast to user {uid} failed: {e}")
                self.disconnect(ws)
    
    async def send_personal(self, websocket: WebSocket, message: dict):
        """向单个连接发送消息"""
        try:
            if hasattr(websocket, 'client_state') and websocket.client_state.value != 1:
                self.disconnect(websocket)
                return False
            
            await websocket.send_json(message)
            return True
        except Exception as e:
            logger.error(f"Send personal message failed: {e}")
            self.disconnect(websocket)
            return False

# 全局单例
manager = ConnectionManager()
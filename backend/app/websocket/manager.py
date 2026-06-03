from fastapi import WebSocket # pyright: ignore[reportMissingImports]
from typing import Dict, Optional
import logging

logger = logging.getLogger(__name__)


class ConnectionManager:
    """WebSocket 连接管理器 - 增强版（支持项目级和用户级频道）"""

    def __init__(self):
        # 1. 存储项目级连接：{project_id: {user_id: websocket}}
        self.active_connections: Dict[int, Dict[int, WebSocket]] = {}

        # 2. 存储用户级全局连接（如 Menu 页面）：{user_id: websocket}
        self.user_connections: Dict[int, WebSocket] = {}

        # 3. 反向索引：{websocket: (type, *identifiers)}
        # type 可以是 'project' 或 'user'
        self.connection_map: Dict[WebSocket, tuple] = {}

    async def connect(
        self, websocket: WebSocket, project_id: int, user_id: int
    ) -> bool:
        """接受项目级连接并存储。如果用户已存在，直接替换旧连接"""
        try:
            await websocket.accept()

            if project_id not in self.active_connections:
                self.active_connections[project_id] = {}

            # 如果该用户在此项目已有连接，直接替换引用，避免竞态
            if user_id in self.active_connections[project_id]:
                old_ws = self.active_connections[project_id][user_id]
                logger.warning(
                    f"User {user_id} reconnected to project {project_id}. Replacing old connection."
                )
                self.connection_map.pop(old_ws, None)

            self.active_connections[project_id][user_id] = websocket
            # 记录连接类型和标识，方便 disconnect 时区分清理
            self.connection_map[websocket] = ("project", project_id, user_id)

            logger.info(
                f"Project WebSocket connected: user_id={user_id}, project_id={project_id}"
            )
            return True
        except Exception as e:
            logger.error(f"Failed to accept project WebSocket connection: {e}")
            return False

    async def connect_user(self, websocket: WebSocket, user_id: int) -> bool:
        """接受用户级全局连接（如 Menu 页面通知）"""
        try:
            await websocket.accept()

            # 如果用户已有全局连接，替换旧连接
            if user_id in self.user_connections:
                old_ws = self.user_connections[user_id]
                logger.warning(
                    f"User {user_id} reconnected to user global channel. Replacing old connection."
                )
                self.connection_map.pop(old_ws, None)

            self.user_connections[user_id] = websocket
            self.connection_map[websocket] = ("user", user_id)

            logger.info(f"User global WebSocket connected: user_id={user_id}")
            return True
        except Exception as e:
            logger.error(f"Failed to accept user global WebSocket connection: {e}")
            return False

    def disconnect(self, websocket: WebSocket):
        """断开连接并清理所有映射"""
        info = self.connection_map.pop(websocket, None)
        if info:
            conn_type = info[0]

            if conn_type == "project" and len(info) == 3:
                _, project_id, user_id = info
                if project_id in self.active_connections:
                    if self.active_connections[project_id].get(user_id) == websocket:
                        del self.active_connections[project_id][user_id]
                    if not self.active_connections[project_id]:
                        del self.active_connections[project_id]
                logger.info(
                    f"Project WebSocket disconnected: user_id={user_id}, project_id={project_id}"
                )

            elif conn_type == "user" and len(info) == 2:
                _, user_id = info
                if self.user_connections.get(user_id) == websocket:
                    del self.user_connections[user_id]
                logger.info(f"User global WebSocket disconnected: user_id={user_id}")
        else:
            logger.debug("Disconnect called for unknown or already replaced websocket")

    async def broadcast(
        self, project_id: int, message: dict, exclude_user_id: Optional[int] = None
    ):
        """向项目的所有连接广播消息"""
        if project_id not in self.active_connections:
            logger.warning(
                f"Broadcast failed: Project {project_id} has no active connections."
            )
            return

        connections_to_send = []
        target_users = []

        for uid, ws in list(self.active_connections[project_id].items()):
            if exclude_user_id is not None and uid == exclude_user_id:
                continue

            if hasattr(ws, "client_state") and ws.client_state.value == 1:
                connections_to_send.append((uid, ws))
                target_users.append(uid)
            else:
                logger.warning(
                    f"Broadcast: Found stale connection for user {uid}. Cleaning up."
                )
                self.disconnect(ws)

        msg_type = message.get("type", "unknown")
        logger.info(
            f"Broadcasting message type='{msg_type}' to project {project_id}. Targets: {target_users}, Excluded: {exclude_user_id}"
        )

        if not connections_to_send:
            logger.debug(
                f"Broadcast: No active connections to send to in project {project_id}."
            )
            return

        for uid, ws in connections_to_send:
            try:
                await ws.send_json(message)
            except Exception as e:
                logger.error(f"Broadcast to user {uid} failed: {e}")
                self.disconnect(ws)

    async def send_to_user(self, user_id: int, message: dict) -> bool:
        """向特定用户的全局连接发送消息（如 Menu 页面通知）"""
        ws = self.user_connections.get(user_id)
        if ws and hasattr(ws, "client_state") and ws.client_state.value == 1:
            try:
                await ws.send_json(message)
                return True
            except Exception as e:
                logger.error(f"Send to user {user_id} failed: {e}")
                # 发送失败可能是连接已断开，清理
                self.disconnect(ws)
                return False
        else:
            logger.debug(
                f"Send to user {user_id} failed: No active global connection found."
            )
            return False

    async def send_personal(self, websocket: WebSocket, message: dict):
        """向单个连接发送消息"""
        try:
            if hasattr(websocket, "client_state") and websocket.client_state.value != 1:
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

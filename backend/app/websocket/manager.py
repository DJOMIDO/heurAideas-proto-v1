# backend/app/websocket/manager.py

from fastapi import WebSocket # pyright: ignore[reportMissingImports]
from typing import List, Dict
import json

class ConnectionManager:
    """WebSocket 连接管理器"""
    
    def __init__(self):
        # 存储连接：{project_id: [websocket_connections]}
        self.active_connections: Dict[int, List[WebSocket]] = {}
    
    async def connect(self, websocket: WebSocket, project_id: int):
        """接受连接并存储"""
        await websocket.accept()
        if project_id not in self.active_connections:
            self.active_connections[project_id] = []
        self.active_connections[project_id].append(websocket)
        print(f"WebSocket connected: project_id={project_id}")
    
    def disconnect(self, websocket: WebSocket, project_id: int):
        """断开连接并移除"""
        if project_id in self.active_connections:
            if websocket in self.active_connections[project_id]:
                self.active_connections[project_id].remove(websocket)
                print(f"WebSocket disconnected: project_id={project_id}")
    
    async def broadcast(self, project_id: int, message: dict):
        """向项目的所有连接广播消息"""
        if project_id in self.active_connections:
            for connection in self.active_connections[project_id]:
                try:
                    await connection.send_json(message)
                except Exception as e:
                    print(f"Broadcast failed: {e}")
    
    async def send_personal(self, websocket: WebSocket, message: dict):
        """向单个连接发送消息"""
        try:
            await websocket.send_json(message)
        except Exception as e:
            print(f"Send failed: {e}")

# 全局单例
manager = ConnectionManager()
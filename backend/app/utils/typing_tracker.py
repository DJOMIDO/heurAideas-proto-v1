# backend/app/utils/typing_tracker.py

from typing import Dict
from datetime import datetime, timedelta

class TypingTracker:
    """内存追踪用户编辑状态"""
    
    def __init__(self):
        # 结构：{project_id: {substep_id: {field: {user_id, username, timestamp}}}}
        self.editing_states: Dict[int, Dict[str, Dict[str, dict]]] = {}
    
    def start_typing(self, project_id: int, substep_id: str, field: str, user_id: int, username: str):
        """开始编辑"""
        if project_id not in self.editing_states:
            self.editing_states[project_id] = {}
        if substep_id not in self.editing_states[project_id]:
            self.editing_states[project_id][substep_id] = {}
        
        self.editing_states[project_id][substep_id][field] = {
            "user_id": user_id,
            "username": username,
            "timestamp": datetime.now().isoformat()
        }
    
    def stop_typing(self, project_id: int, substep_id: str, field: str):
        """停止编辑"""
        if project_id in self.editing_states:
            if substep_id in self.editing_states[project_id]:
                if field in self.editing_states[project_id][substep_id]:
                    del self.editing_states[project_id][substep_id][field]
    
    def get_editing_users(self, project_id: int, substep_id: str, exclude_user_id: int) -> Dict[str, dict]:
        """获取当前编辑用户（排除自己）"""
        if project_id not in self.editing_states:
            return {}
        if substep_id not in self.editing_states[project_id]:
            return {}
        
        return {
            field: info 
            for field, info in self.editing_states[project_id][substep_id].items()
            if info["user_id"] != exclude_user_id
        }
    
    def cleanup_expired(self, timeout_seconds: int = 5):
        """清理超时的编辑状态（超过 5 秒无活动视为停止）"""
        now = datetime.now()
        timeout = timedelta(seconds=timeout_seconds)
        
        for project_id in list(self.editing_states.keys()):
            for substep_id in list(self.editing_states[project_id].keys()):
                for field in list(self.editing_states[project_id][substep_id].keys()):
                    info = self.editing_states[project_id][substep_id][field]
                    timestamp = datetime.fromisoformat(info["timestamp"])
                    if now - timestamp > timeout:
                        del self.editing_states[project_id][substep_id][field]

# 全局单例
typing_tracker = TypingTracker()
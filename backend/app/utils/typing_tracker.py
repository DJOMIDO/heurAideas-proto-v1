# backend/app/utils/typing_tracker.py

from typing import Dict
from datetime import datetime, timedelta

class TypingTracker:
    
    def __init__(self):
        self.editing_states: Dict[int, Dict[str, Dict[str, dict]]] = {}
    
    def start_typing(self, project_id: int, substep_id: str, field: str, user_id: int, username: str):
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
        if project_id in self.editing_states:
            if substep_id in self.editing_states[project_id]:
                if field in self.editing_states[project_id][substep_id]:
                    del self.editing_states[project_id][substep_id][field]
    
    def get_editing_users(self, project_id: int, substep_id: str, exclude_user_id: int) -> Dict[str, dict]:
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

        now = datetime.now()
        timeout = timedelta(seconds=timeout_seconds)
        
        for project_id in list(self.editing_states.keys()):
            for substep_id in list(self.editing_states[project_id].keys()):
                for field in list(self.editing_states[project_id][substep_id].keys()):
                    info = self.editing_states[project_id][substep_id][field]
                    timestamp = datetime.fromisoformat(info["timestamp"])
                    if now - timestamp > timeout:
                        del self.editing_states[project_id][substep_id][field]

typing_tracker = TypingTracker()
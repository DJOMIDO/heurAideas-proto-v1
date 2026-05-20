# backend/app/services/storage.py

import os
import uuid
from pathlib import Path
from fastapi import UploadFile, HTTPException # pyright: ignore[reportMissingImports]
from app.core.config import settings
from typing import Optional


class SupabaseStorageService:
    """Supabase Storage 服务封装（开发模式支持本地存储）"""

    def __init__(self):
        self.supabase_url = settings.SUPABASE_URL
        self.supabase_key = settings.SUPABASE_KEY
        self.bucket_name = settings.SUPABASE_BUCKET

        # 开发模式：如果未配置 Supabase，使用本地文件存储
        self.use_local_storage = not (self.supabase_url and self.supabase_key)

        if self.use_local_storage:
            print("[Storage] Using LOCAL file storage (SUPABASE_URL/KEY not configured)")
            self.local_upload_dir = Path("./uploads")
            self.local_upload_dir.mkdir(parents=True, exist_ok=True)
        else:
            print("[Storage] Using Supabase Storage")
            from supabase import create_client # pyright: ignore[reportMissingImports]
            self.client = create_client(self.supabase_url, self.supabase_key)

    async def upload_file(
        self, 
        project_id: int, 
        file: UploadFile, 
        file_id: str, 
        parent_id: Optional[str] = None
    ) -> str:
        """上传文件，返回相对存储路径（由调用方决定如何生成 URL）"""
        ext = os.path.splitext(file.filename)[1] or ".bin"
        
        # 构建存储路径：如果有 parent_id，放入子目录
        if parent_id:
            storage_path = f"{project_id}/{parent_id}/{file_id}{ext}"
        else:
            storage_path = f"{project_id}/{file_id}{ext}"
        
        if self.use_local_storage:
            # 本地存储：保存文件，返回相对路径（不带开头的 /）
            file_path = self.local_upload_dir / storage_path
            file_path.parent.mkdir(parents=True, exist_ok=True)
            
            content = await file.read()
            with open(file_path, "wb") as f:
                f.write(content)
            
            return f"uploads/{storage_path}"  # 返回: "uploads/1/folder-xxx/file-xxx.pdf"
        else:
            # Supabase Storage：上传文件，返回 bucket 内的相对路径
            content = await file.read()
            
            try:
                self.client.storage.from_(self.bucket_name).upload(
                    path=storage_path,
                    file=content,
                    file_options={"content-type": file.content_type or "application/octet-stream"}
                )
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")
            
            return storage_path  # 返回: "1/folder-xxx/file-xxx.pdf"

    def delete_file(self, storage_path: str) -> bool:
        """删除文件"""
        if self.use_local_storage:
            # 本地存储：移除 "uploads/" 前缀
            if storage_path.startswith("uploads/"):
                storage_path = storage_path[len("uploads/"):]
            file_path = self.local_upload_dir / storage_path
            if file_path.exists():
                file_path.unlink()
            return True
        else:
            # Supabase Storage
            try:
                # 移除 URL 前缀，只保留 bucket 内的路径
                if self.bucket_name in storage_path:
                    storage_path = storage_path.split(f"/{self.bucket_name}/")[-1]
                self.client.storage.from_(self.bucket_name).remove([storage_path])
                return True
            except Exception:
                return False

    def get_public_url(self, storage_path: str) -> str:
        """生成公开访问 URL（仅本地模式使用，Supabase 模式由 _get_public_url 处理）"""
        if self.use_local_storage:
            # 确保路径以 / 开头供浏览器访问
            return f"/{storage_path}" if not storage_path.startswith("/") else storage_path
        else:
            return f"{self.supabase_url}/storage/v1/object/public/{self.bucket_name}/{storage_path}"


# 延迟初始化单例（保持不变）
_storage_service_instance = None

def get_storage_service() -> SupabaseStorageService:
    global _storage_service_instance
    if _storage_service_instance is None:
        _storage_service_instance = SupabaseStorageService()
    return _storage_service_instance

class _LazyStorage:
    def __getattr__(self, name):
        service = get_storage_service()
        return getattr(service, name)

storage_service = _LazyStorage()
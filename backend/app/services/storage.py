# backend/app/services/storage.py

import os
import uuid
from pathlib import Path
from fastapi import UploadFile, HTTPException # pyright: ignore[reportMissingImports]
from app.core.config import settings
from typing import Optional


class SupabaseStorageService:

    def __init__(self):
        self.supabase_url = settings.SUPABASE_URL
        self.supabase_key = settings.SUPABASE_KEY
        self.bucket_name = settings.SUPABASE_BUCKET

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
        ext = os.path.splitext(file.filename)[1] or ".bin"

        if parent_id:
            storage_path = f"{project_id}/{parent_id}/{file_id}{ext}"
        else:
            storage_path = f"{project_id}/{file_id}{ext}"
        
        if self.use_local_storage:
            file_path = self.local_upload_dir / storage_path
            file_path.parent.mkdir(parents=True, exist_ok=True)
            
            content = await file.read()
            with open(file_path, "wb") as f:
                f.write(content)
            
            return f"uploads/{storage_path}"
        else:
            content = await file.read()
            
            try:
                self.client.storage.from_(self.bucket_name).upload(
                    path=storage_path,
                    file=content,
                    file_options={"content-type": file.content_type or "application/octet-stream"}
                )
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")
            
            return storage_path

    def delete_file(self, storage_path: str) -> bool:
        if self.use_local_storage:
            if storage_path.startswith("uploads/"):
                storage_path = storage_path[len("uploads/"):]
            file_path = self.local_upload_dir / storage_path
            if file_path.exists():
                file_path.unlink()
            return True
        else:
            try:
                if self.bucket_name in storage_path:
                    storage_path = storage_path.split(f"/{self.bucket_name}/")[-1]
                self.client.storage.from_(self.bucket_name).remove([storage_path])
                return True
            except Exception:
                return False

    def get_public_url(self, storage_path: str) -> str:
        if self.use_local_storage:
            return f"/{storage_path}" if not storage_path.startswith("/") else storage_path
        else:
            return f"{self.supabase_url}/storage/v1/object/public/{self.bucket_name}/{storage_path}"

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
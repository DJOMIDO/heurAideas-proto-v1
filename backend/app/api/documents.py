# backend/app/api/documents.py

from fastapi import ( # pyright: ignore[reportMissingImports]
    APIRouter,
    Depends,
    HTTPException,
    UploadFile,
    File,
    Form,
)  # pyright: ignore[reportMissingImports]
from sqlalchemy.orm import Session  # pyright: ignore[reportMissingImports]
from typing import List, Optional
import uuid
from datetime import datetime

from app.database import get_db
from app.models.document import Document
from app.models.user import User
from app.api.auth import get_current_user
from app.utils.permissions import can_access_project
from app.services.storage import storage_service
from app.schemas.document import DocumentFolderCreate
from app.websocket.manager import manager

router = APIRouter(prefix="/projects/{project_id}/documents", tags=["Documents"])


# ==================== 辅助函数 ====================


def _doc_to_dict(doc: Document) -> dict:
    """将 ORM 对象转换为前端所需的字典格式"""
    return {
        "id": doc.id,
        "name": doc.name,
        "type": doc.type,
        "projectId": doc.project_id,
        "parentId": doc.parent_id,
        "extension": doc.extension,
        "size": doc.file_size,
        "updatedAt": doc.updated_at.isoformat() if doc.updated_at else None,
        "url": doc._get_public_url() if doc.storage_path else None,
        "children": [],
    }


def _build_tree(nodes: List[Document]) -> List[dict]:
    """递归构建树形结构"""
    result = []
    for node in nodes:
        node_dict = _doc_to_dict(node)
        if node.type == "folder" and node.children:
            node_dict["children"] = _build_tree(node.children)
        result.append(node_dict)
    return result


def _recursive_delete(db: Session, doc: Document):
    """递归删除节点（包括文件存储和子节点）"""
    # 1. 如果是文件，删除存储内容
    if doc.type == "file" and doc.storage_path:
        storage_service.delete_file(doc.storage_path)

    # 2. 如果是文件夹，递归删除子节点
    children = db.query(Document).filter(Document.parent_id == doc.id).all()
    for child in children:
        _recursive_delete(db, child)
        db.delete(child)


# ==================== API 路由 ====================


@router.get("/tree")
async def get_document_tree(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """获取项目的文档树结构"""
    if not can_access_project(db, project_id, current_user.id):
        raise HTTPException(status_code=403, detail="No access to this project")

    root_nodes = (
        db.query(Document)
        .filter(Document.project_id == project_id, Document.parent_id == None)
        .order_by(Document.created_at.desc())
        .all()
    )

    return _build_tree(root_nodes)


@router.post("/upload")
async def upload_document(
    project_id: int,
    file: UploadFile = File(...),
    parent_id: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """上传文件到项目（支持放入指定文件夹）"""
    if not can_access_project(db, project_id, current_user.id):
        raise HTTPException(status_code=403, detail="No access to this project")

    doc_id = f"file-{uuid.uuid4()}"
    file_extension = (
        file.filename.split(".")[-1].lower() if "." in file.filename else ""
    )

    try:
        storage_path = await storage_service.upload_file(
            project_id=project_id,
            file=file,
            file_id=doc_id,
            parent_id=parent_id,
        )
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

    new_doc = Document(
        id=doc_id,
        project_id=project_id,
        parent_id=parent_id,
        name=file.filename,
        type="file",
        extension=file_extension,
        storage_path=storage_path,
        file_size=file.size,
        mime_type=file.content_type,
        created_by=current_user.id,
    )

    db.add(new_doc)
    db.commit()
    db.refresh(new_doc)

    result = _doc_to_dict(new_doc)

    # 广播创建事件（排除操作者自己）
    await manager.broadcast(
        project_id=project_id,
        message={
            "type": "document.created",
            "data": result,
            "user_id": current_user.id,
            "username": getattr(current_user, "username", "User"),
            "timestamp": datetime.utcnow().isoformat(),
        },
        exclude_user_id=current_user.id,
    )

    return result


@router.post("/folder")
async def create_folder(
    project_id: int,
    folder: DocumentFolderCreate,  # 接收 JSON 请求体
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """创建新文件夹"""
    if not can_access_project(db, project_id, current_user.id):
        raise HTTPException(status_code=403, detail="No access to this project")

    doc_id = f"folder-{uuid.uuid4()}"

    new_folder = Document(
        id=doc_id,
        project_id=project_id,
        parent_id=folder.parent_id,
        name=folder.name,
        type="folder",
        created_by=current_user.id,
    )

    db.add(new_folder)
    db.commit()
    db.refresh(new_folder)

    result = _doc_to_dict(new_folder)

    # 广播创建事件
    await manager.broadcast(
        project_id=project_id,
        message={
            "type": "document.created",
            "data": result,
            "user_id": current_user.id,
            "username": getattr(current_user, "username", "User"),
            "timestamp": datetime.utcnow().isoformat(),
        },
        exclude_user_id=current_user.id,
    )

    return result


@router.patch("/{node_id}/rename")
async def rename_node(
    project_id: int,
    node_id: str,
    name: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """重命名文件或文件夹"""
    if not can_access_project(db, project_id, current_user.id):
        raise HTTPException(status_code=403, detail="No access to this project")

    doc = (
        db.query(Document)
        .filter(Document.id == node_id, Document.project_id == project_id)
        .first()
    )

    if not doc:
        raise HTTPException(status_code=404, detail="Node not found")

    doc.name = name
    db.commit()
    db.refresh(doc)

    result = _doc_to_dict(doc)

    # 广播更新事件
    await manager.broadcast(
        project_id=project_id,
        message={
            "type": "document.updated",
            "data": result,
            "user_id": current_user.id,
            "username": getattr(current_user, "username", "User"),
            "timestamp": datetime.utcnow().isoformat(),
        },
        exclude_user_id=current_user.id,
    )

    return result


@router.delete("/{node_id}")
async def delete_node(
    project_id: int,
    node_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """删除文件或文件夹（文件夹会递归删除内容）"""
    if not can_access_project(db, project_id, current_user.id):
        raise HTTPException(status_code=403, detail="No access to this project")

    doc = (
        db.query(Document)
        .filter(Document.id == node_id, Document.project_id == project_id)
        .first()
    )

    if not doc:
        raise HTTPException(status_code=404, detail="Node not found")

    _recursive_delete(db, doc)
    db.delete(doc)
    db.commit()

    # 广播删除事件（只需传递被删除的节点 ID）
    await manager.broadcast(
        project_id=project_id,
        message={
            "type": "document.deleted",
            "data": {"id": node_id},
            "user_id": current_user.id,
            "username": getattr(current_user, "username", "User"),
            "timestamp": datetime.utcnow().isoformat(),
        },
        exclude_user_id=current_user.id,
    )

    return {"success": True}

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
from pydantic import BaseModel # pyright: ignore[reportMissingImports]

router = APIRouter(prefix="/projects/{project_id}/documents", tags=["Documents"])

def _doc_to_dict(doc: Document) -> dict:
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
        "tags": doc.tags or [],
        "children": [],
    }

class TagUpdateRequest(BaseModel):
    tags: List[str]

class RenameRequest(BaseModel):
    name: str

def _build_tree(nodes: List[Document]) -> List[dict]:
    result = []
    for node in nodes:
        node_dict = _doc_to_dict(node)
        if node.type == "folder" and node.children:
            node_dict["children"] = _build_tree(node.children)
        result.append(node_dict)
    return result


def _recursive_delete(db: Session, doc: Document):
    if doc.type == "file" and doc.storage_path:
        storage_service.delete_file(doc.storage_path)

    children = db.query(Document).filter(Document.parent_id == doc.id).all()
    for child in children:
        _recursive_delete(db, child)
        db.delete(child)


@router.get("/tree")
async def get_document_tree(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
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
    folder: DocumentFolderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
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
    body: RenameRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not can_access_project(db, project_id, current_user.id):
        raise HTTPException(status_code=403, detail="No access to this project")
    
    doc = (
        db.query(Document)
        .filter(Document.id == node_id, Document.project_id == project_id)
        .first()
    )

    if not doc:
        raise HTTPException(status_code=404, detail="Node not found")

    doc.name = body.name
    db.commit()
    db.refresh(doc)

    result = _doc_to_dict(doc)

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

@router.patch("/{node_id}/tags")
async def update_node_tags(
    project_id: int,
    node_id: str,
    body: TagUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not can_access_project(db, project_id, current_user.id):
        raise HTTPException(status_code=403, detail="No access to this project")

    doc = db.query(Document).filter(Document.id == node_id, Document.project_id == project_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Node not found")

    doc.tags = body.tags
    db.commit()
    db.refresh(doc)

    result = _doc_to_dict(doc)

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

// frontend/src/api/documents.ts

import { API_BASE_URL, API_ENDPOINTS } from "./config";
import type { DocumentNode } from "@/pages/documents/types";
import { getToken } from "@/utils/auth";

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = getToken();
  const isFileUpload = options.body instanceof FormData;

  const response = await fetch(url, {
    ...options,
    headers: {
      ...(isFileUpload ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }

  return response.json();
}

export async function fetchDocuments(
  projectId: number,
): Promise<DocumentNode[]> {
  return request<DocumentNode[]>(API_ENDPOINTS.DOCUMENT_TREE(projectId));
}

export async function createFolder(
  projectId: number,
  name: string,
  parentId: string | null = null,
): Promise<DocumentNode> {
  return request<DocumentNode>(API_ENDPOINTS.DOCUMENT_FOLDER(projectId), {
    method: "POST",
    body: JSON.stringify({
      name,
      parent_id: parentId,
    }),
  });
}

export async function uploadDocument(
  projectId: number,
  file: File,
  parentId: string | null = null,
): Promise<DocumentNode> {
  const formData = new FormData();
  formData.append("file", file);
  if (parentId) {
    formData.append("parent_id", parentId);
  }

  return request<DocumentNode>(API_ENDPOINTS.DOCUMENT_UPLOAD(projectId), {
    method: "POST",
    body: formData,
  });
}

export async function renameNode(
  projectId: number,
  nodeId: string,
  newName: string,
): Promise<DocumentNode> {
  return request<DocumentNode>(
    API_ENDPOINTS.DOCUMENT_RENAME(projectId, nodeId),
    {
      method: "PATCH",
      body: JSON.stringify({ name: newName }),
    },
  );
}

export async function deleteNode(
  projectId: number,
  nodeId: string,
): Promise<{ success: boolean }> {
  return request<{ success: boolean }>(
    API_ENDPOINTS.DOCUMENT_DELETE(projectId, nodeId),
    {
      method: "DELETE",
    },
  );
}

export async function updateDocumentTags(
  projectId: number,
  nodeId: string,
  tags: string[],
): Promise<DocumentNode> {
  const endpoint = `/projects/${projectId}/documents/${nodeId}/tags`;

  return request<DocumentNode>(endpoint, {
    method: "PATCH",
    body: JSON.stringify({ tags }),
  });
}

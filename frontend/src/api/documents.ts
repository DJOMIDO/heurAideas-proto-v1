// frontend/src/api/documents.ts

import { API_BASE_URL, API_ENDPOINTS } from "./config";
import type { DocumentNode } from "@/pages/documents/types";
import { getToken } from "@/utils/auth";

// 内部请求封装（复用 projects.ts 的逻辑）
async function request<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = getToken();

  // 如果是文件上传，不设置 Content-Type，让浏览器自动处理 boundary
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

// ================= API 函数 =================

/**
 * 获取项目文档树
 */
export async function fetchDocuments(
  projectId: number,
): Promise<DocumentNode[]> {
  return request<DocumentNode[]>(API_ENDPOINTS.DOCUMENT_TREE(projectId));
}

/**
 * 创建文件夹
 */
export async function createFolder(
  projectId: number,
  name: string,
  parentId: string | null = null,
): Promise<DocumentNode> {
  return request<DocumentNode>(API_ENDPOINTS.DOCUMENT_FOLDER(projectId), {
    method: "POST",
    body: JSON.stringify({
      name,
      parent_id: parentId, // 后端通常期望 parent_id
    }),
  });
}

/**
 * 上传文件
 */
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

/**
 * 重命名节点（文件或文件夹）
 */
export async function renameNode(
  projectId: number,
  nodeId: string,
  newName: string,
): Promise<DocumentNode> {
  return request<DocumentNode>(
    API_ENDPOINTS.DOCUMENT_RENAME(projectId, nodeId),
    {
      method: "PATCH", // 或 PUT，视后端实现而定
      body: JSON.stringify({ name: newName }),
    },
  );
}

/**
 * 删除节点（文件或文件夹）
 */
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

// frontend/src/api/comments.ts

import { API_BASE_URL, API_ENDPOINTS } from "./config";
import { getToken } from "@/utils/auth";
import type {
  Comment,
  CommentListResponse,
  CommentCountResponse,
} from "@/types/comment";

// 复用现有的 request 函数（与 projects.ts 一致）
async function request<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const token = getToken();

  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
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

// ==================== 评论列表 ====================

/**
 * 获取项目的所有评论
 */
export async function getProjectComments(
  projectId: number,
  substepId?: string,
  subtaskId?: string,
  includeResolved: boolean = true, // 现在在 URL 参数中使用
): Promise<CommentListResponse> {
  const params = new URLSearchParams({
    include_resolved: String(includeResolved), // 使用这个参数
  });

  if (substepId) params.append("substep_id", substepId);
  if (subtaskId) params.append("subtask_id", subtaskId);

  return request<CommentListResponse>(
    `${API_ENDPOINTS.COMMENTS_BY_PROJECT(projectId)}?${params}`,
  );
}

/**
 * 获取指定子步骤的所有评论
 */
export async function getSubstepComments(
  substepId: string,
  projectId: number,
  includeResolved: boolean = true,
): Promise<CommentListResponse> {
  const params = new URLSearchParams({
    project_id: String(projectId), // 通过 params 传递
    include_resolved: String(includeResolved),
  });

  return request<CommentListResponse>(
    `${API_ENDPOINTS.COMMENTS_BY_SUBSTEP(substepId)}?${params}`, // 只传 substepId
  );
}

// ==================== 创建评论 ====================

export interface CreateCommentInput {
  projectId: number;
  projectSubstepId: number;
  projectStepId?: number;
  projectSubtaskId?: number;
  content: string;
  positionX?: number;
  positionY?: number;
  anchorType?: "free" | "element" | "stakeholder" | "section";
  anchorId?: string;
  parentId?: number;
}

/**
 * 创建新评论或回复
 */
export async function createComment(
  input: CreateCommentInput,
): Promise<Comment> {
  return request<Comment>(API_ENDPOINTS.COMMENTS, {
    method: "POST",
    body: JSON.stringify({
      project_id: input.projectId,
      project_substep_id: input.projectSubstepId,
      project_step_id: input.projectStepId,
      project_subtask_id: input.projectSubtaskId,
      content: input.content,
      position_x: input.positionX,
      position_y: input.positionY,
      anchor_type: input.anchorType || "free",
      anchor_id: input.anchorId,
      parent_id: input.parentId,
    }),
  });
}

// ==================== 更新评论 ====================

export interface UpdateCommentInput {
  content?: string;
  positionX?: number;
  positionY?: number;
  isResolved?: boolean;
}

/**
 * 更新评论（仅作者可更新）
 */
export async function updateComment(
  commentId: number,
  updates: UpdateCommentInput,
): Promise<Comment> {
  return request<Comment>(API_ENDPOINTS.COMMENT_DETAIL(commentId), {
    method: "PUT",
    body: JSON.stringify({
      content: updates.content,
      position_x: updates.positionX,
      position_y: updates.positionY,
      is_resolved: updates.isResolved,
    }),
  });
}

// ==================== 删除评论 ====================

/**
 * 软删除评论（仅作者可删除）
 */
export async function deleteComment(commentId: number): Promise<void> {
  await request<void>(API_ENDPOINTS.COMMENT_DETAIL(commentId), {
    method: "DELETE",
  });
}

// ==================== 标记为解决/未解决 ====================

/**
 * 标记评论为已解决
 */
export async function resolveComment(commentId: number): Promise<Comment> {
  return request<Comment>(API_ENDPOINTS.COMMENT_RESOLVE(commentId), {
    method: "POST",
  });
}

/**
 * 标记评论为未解决
 */
export async function unresolveComment(commentId: number): Promise<Comment> {
  return request<Comment>(API_ENDPOINTS.COMMENT_UNRESOLVE(commentId), {
    method: "POST",
  });
}

// ==================== 获取评论统计 ====================

/**
 * 获取项目评论统计
 */
export async function getCommentCount(
  projectId: number,
): Promise<CommentCountResponse> {
  return request<CommentCountResponse>(API_ENDPOINTS.COMMENT_COUNT(projectId));
}

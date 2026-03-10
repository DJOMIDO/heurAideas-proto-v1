// frontend/src/utils/commentState.ts

import { type Comment, type CommentState } from "@/types/comment";
import { getUserId } from "./auth";

const STORAGE_PREFIX = "substep-comments-";

function getStorageKey(projectId: number, substepId: string): string {
  const userId = getUserId();
  return userId
    ? `${STORAGE_PREFIX}${userId}-${projectId}-${substepId}`
    : `${STORAGE_PREFIX}${projectId}-${substepId}`;
}

export function getCommentState(
  projectId: number,
  substepId: string,
): CommentState | null {
  const key = getStorageKey(projectId, substepId);
  const data = localStorage.getItem(key);

  if (!data) return null;

  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export function saveCommentState(
  projectId: number,
  substepId: string,
  state: Partial<CommentState>,
): void {
  const existing = getCommentState(projectId, substepId) || {
    comments: [],
    lastUpdated: new Date().toISOString(),
  };

  const merged: CommentState = {
    ...existing,
    ...state,
    lastUpdated: new Date().toISOString(),
  };

  const key = getStorageKey(projectId, substepId);
  localStorage.setItem(key, JSON.stringify(merged));
}

export function addComment(
  projectId: number,
  substepId: string,
  comment: Comment,
): void {
  const state = getCommentState(projectId, substepId) || {
    comments: [],
    lastUpdated: new Date().toISOString(),
  };

  state.comments.push(comment);
  saveCommentState(projectId, substepId, { comments: state.comments });
}

export function deleteComment(
  projectId: number,
  substepId: string,
  commentId: string,
): void {
  const state = getCommentState(projectId, substepId);
  if (!state) return;

  state.comments = state.comments.filter((c) => c.id !== commentId);
  saveCommentState(projectId, substepId, { comments: state.comments });
}

export function updateComment(
  projectId: number,
  substepId: string,
  commentId: string,
  updates: Partial<Comment>,
): void {
  const state = getCommentState(projectId, substepId);
  if (!state) return;

  const index = state.comments.findIndex((c) => c.id === commentId);
  if (index === -1) return;

  state.comments[index] = { ...state.comments[index], ...updates };
  saveCommentState(projectId, substepId, { comments: state.comments });
}

export function getCommentsBySubtask(
  projectId: number,
  substepId: string,
  subtaskId?: string,
): Comment[] {
  const state = getCommentState(projectId, substepId);
  if (!state) return [];

  return state.comments.filter((c) => {
    if (c.parentId) return false;
    if (!subtaskId) return true;
    return c.subtaskId === subtaskId || !c.subtaskId;
  });
}

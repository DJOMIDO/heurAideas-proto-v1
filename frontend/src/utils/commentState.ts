// frontend/src/utils/commentState.ts

import { type Comment, type CommentState } from "@/types/comment";
import { getUserId } from "./auth";

import {
  getSubstepComments,
  createComment,
  updateComment as updateCommentApi,
  deleteComment as deleteCommentApi,
  resolveComment,
} from "@/api/comments";

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
    if (c.parentId !== null && c.parentId !== undefined && c.parentId !== "") {
      return false;
    }

    if (!subtaskId) return true;

    const commentSubtaskId = c.subtaskId ? String(c.subtaskId) : "";
    return commentSubtaskId === subtaskId;
  });
}

function flattenReplies(
  comment: any,
  allComments: Comment[],
  substepCode: string,
): void {
  if (comment.replies && comment.replies.length > 0) {
    comment.replies.forEach((reply: any) => {
      const replySubtaskId = reply.project_subtask_code
        ? String(reply.project_subtask_code)
        : reply.subtaskId
          ? String(reply.subtaskId)
          : undefined;

      const parentId = reply.parent_id ?? comment.id;

      allComments.push({
        id: reply.id,
        projectId: reply.project_id || reply.projectId,
        stepId: reply.project_step_id || reply.stepId,
        substepId: reply.project_substep_id || reply.substepId || substepCode,
        subtaskId: replySubtaskId,
        anchorType: reply.anchor_type || reply.anchorType || "free",
        anchorId: reply.anchor_id || reply.anchorId,
        position:
          reply.position_x !== null && reply.position_y !== null
            ? { x: reply.position_x || 0, y: reply.position_y || 0 }
            : undefined,
        content: reply.content,
        authorId: reply.author_id || reply.authorId,
        authorName: reply.author_name || reply.authorName,
        createdAt: reply.created_at || reply.createdAt,
        updatedAt: reply.updated_at || reply.updatedAt,
        resolved:
          reply.is_resolved !== undefined
            ? reply.is_resolved
            : reply.resolved || false,
        deleted:
          reply.is_deleted !== undefined
            ? reply.is_deleted
            : reply.deleted || false,
        edited:
          reply.is_edited !== undefined
            ? reply.is_edited
            : reply.edited || false,
        parentId: parentId,
        replies: [],
      });

      flattenReplies(reply, allComments, substepCode);
    });
  }
}

export async function syncCommentsFromApi(
  projectId: number,
  substepCode: string,
  projectSubstepId: number,
): Promise<Comment[]> {
  if (!projectSubstepId) {
    return getCommentState(projectId, substepCode)?.comments || [];
  }

  try {
    const response = await getSubstepComments(substepCode, projectId, true);

    const apiComments: Comment[] = [];
    const apiCommentIds = new Set<number>();

    response.comments.forEach((comment: any) => {
      const subtaskId = comment.project_subtask_code
        ? String(comment.project_subtask_code)
        : comment.subtaskId
          ? String(comment.subtaskId)
          : undefined;

      const mainCommentParentId = comment.parent_id ?? comment.parentId ?? null;

      apiComments.push({
        id: comment.id,
        projectId: comment.project_id || comment.projectId,
        stepId: comment.project_step_id || comment.stepId,
        substepId:
          comment.project_substep_id || comment.substepId || substepCode,
        subtaskId: subtaskId,
        anchorType: comment.anchor_type || comment.anchorType || "free",
        anchorId: comment.anchor_id || comment.anchorId,
        position:
          comment.position_x !== null && comment.position_y !== null
            ? { x: comment.position_x || 0, y: comment.position_y || 0 }
            : undefined,
        content: comment.content,
        authorId: comment.author_id || comment.authorId,
        authorName: comment.author_name || comment.authorName,
        createdAt: comment.created_at || comment.createdAt,
        updatedAt: comment.updated_at || comment.updatedAt,
        resolved:
          comment.is_resolved !== undefined
            ? comment.is_resolved
            : comment.resolved || false,
        deleted:
          comment.is_deleted !== undefined
            ? comment.is_deleted
            : comment.deleted || false,
        edited:
          comment.is_edited !== undefined
            ? comment.is_edited
            : comment.edited || false,
        parentId: mainCommentParentId,
        replies: [],
      });

      apiCommentIds.add(comment.id);

      flattenReplies(comment, apiComments, substepCode);

      const collectIds = (replies: any[]) => {
        replies.forEach((reply: any) => {
          apiCommentIds.add(reply.id);
          if (reply.replies && reply.replies.length > 0) {
            collectIds(reply.replies);
          }
        });
      };

      if (comment.replies && comment.replies.length > 0) {
        collectIds(comment.replies);
      }
    });

    const localState = getCommentState(projectId, substepCode);
    const localComments = localState?.comments || [];

    const unsyncedLocalComments = localComments.filter(
      (c) => typeof c.id === "string" && !apiCommentIds.has(c.id as any),
    );

    const mergedComments = [...apiComments, ...unsyncedLocalComments];

    const uniqueComments = Array.from(
      new Map(mergedComments.map((c) => [c.id, c])).values(),
    );

    saveCommentState(projectId, substepCode, {
      comments: uniqueComments,
      lastUpdated: new Date().toISOString(),
    });

    return uniqueComments;
  } catch (error) {
    console.error("[syncCommentsFromApi] Failed:", error);
    return getCommentState(projectId, substepCode)?.comments || [];
  }
}

export async function saveCommentToApi(
  projectId: number,
  projectSubstepId: number,
  comment: Comment,
): Promise<Comment | null> {
  if (typeof comment.id === "number") {
    return comment;
  }

  try {
    const response = await createComment({
      projectId,
      projectSubstepId,
      projectStepId: comment.stepId ? Number(comment.stepId) : undefined,
      projectSubtaskCode: comment.subtaskId
        ? String(comment.subtaskId)
        : undefined,
      content: comment.content,
      positionX: comment.position?.x
        ? Math.round(comment.position.x)
        : undefined,
      positionY: comment.position?.y
        ? Math.round(comment.position.y)
        : undefined,
      anchorType: comment.anchorType,
      anchorId: comment.anchorId,
      parentId:
        typeof comment.parentId === "number" ? comment.parentId : undefined,
    });

    const key = getStorageKey(projectId, String(projectSubstepId));
    const rawData = localStorage.getItem(key);

    if (rawData) {
      const state: CommentState = JSON.parse(rawData);

      const filteredComments = state.comments.filter(
        (c) => c.id !== comment.id,
      );

      filteredComments.push({
        ...comment,
        id: response.id,
        updatedAt: response.updatedAt,
        subtaskId: response.project_subtask_code || comment.subtaskId,
      });

      localStorage.setItem(
        key,
        JSON.stringify({
          comments: filteredComments,
          lastUpdated: new Date().toISOString(),
        }),
      );
    }

    return response;
  } catch (error) {
    console.error("[saveCommentToApi] Failed:", error);
    return null;
  }
}

export async function updateCommentPositionToApi(
  commentId: number,
  newPos: { x: number; y: number },
): Promise<void> {
  try {
    await updateCommentApi(commentId, {
      positionX: newPos.x,
      positionY: newPos.y,
    });
  } catch (error) {
    console.error("[updateCommentPositionToApi] Failed:", error);
  }
}

export async function deleteCommentWithApi(
  projectId: number,
  substepId: string,
  commentId: string | number,
): Promise<void> {
  const key = getStorageKey(projectId, substepId);
  const rawData = localStorage.getItem(key);

  if (rawData) {
    const state: CommentState = JSON.parse(rawData);
    state.comments = state.comments.filter((c) => c.id !== commentId);
    localStorage.setItem(key, JSON.stringify(state));
  }

  if (typeof commentId === "number") {
    await deleteCommentApi(commentId);
  }
}

export async function resolveCommentWithApi(
  projectId: number,
  substepId: string,
  commentId: string | number,
): Promise<void> {
  if (typeof commentId !== "number") {
    updateComment(projectId, substepId, String(commentId), { resolved: true });
    return;
  }

  try {
    await resolveComment(commentId);

    updateComment(projectId, substepId, String(commentId), { resolved: true });
  } catch (error) {
    console.error("[resolveCommentWithApi] Failed:", error);
    throw error;
  }
}

export function getUnsyncedComments(
  projectId: number,
  substepId: string,
): Comment[] {
  const state = getCommentState(projectId, substepId);

  if (!state) return [];

  const unsynced = state.comments.filter((c) => {
    const isString = typeof c.id === "string";
    return isString;
  });

  return unsynced;
}

export async function syncUnsyncedCommentsToApi(
  projectId: number,
  substepId: string,
  projectSubstepId: number,
): Promise<number> {
  const key = getStorageKey(projectId, substepId);
  const rawData = localStorage.getItem(key);
  if (!rawData) return 0;

  const state: CommentState = JSON.parse(rawData);

  const unsyncedComments = state.comments.filter((c) => {
    if (typeof c.id !== "string") return false;
    if (c.deleted === true || c.is_deleted === true) return false;
    return true;
  });

  if (unsyncedComments.length === 0) {
    return 0;
  }

  let successCount = 0;
  const updatedComments = new Map<string, Comment>();

  for (const comment of unsyncedComments) {
    const result = await createComment({
      projectId,
      projectSubstepId,
      projectStepId: comment.stepId ? Number(comment.stepId) : undefined,
      projectSubtaskCode: comment.subtaskId
        ? String(comment.subtaskId)
        : undefined,
      content: comment.content,
      positionX: comment.position?.x
        ? Math.round(comment.position.x)
        : undefined,
      positionY: comment.position?.y
        ? Math.round(comment.position.y)
        : undefined,
      anchorType: comment.anchorType,
      anchorId: comment.anchorId,
      parentId:
        typeof comment.parentId === "number" ? comment.parentId : undefined,
    });
    if (result) {
      successCount++;

      updatedComments.set(String(comment.id), {
        ...comment,
        id: result.id,
        updatedAt: result.updatedAt,
        subtaskId: result.project_subtask_code || comment.subtaskId,
      });
    }
  }

  if (updatedComments.size > 0) {
    const finalComments = state.comments.map((c) =>
      updatedComments.has(String(c.id))
        ? updatedComments.get(String(c.id))!
        : c,
    );

    localStorage.setItem(
      key,
      JSON.stringify({
        comments: finalComments,
        lastUpdated: new Date().toISOString(),
      }),
    );
  }

  return successCount;
}

// frontend/src/hooks/useComment.ts

import { useState, useEffect, useCallback, useRef } from "react";
import {
  getCommentState,
  addComment,
  deleteComment,
  updateComment,
  getCommentsBySubtask,
  syncCommentsFromApi,
  deleteCommentWithApi,
} from "@/utils/commentState";
import { type Comment } from "@/types/comment";
import { getUserInfo } from "@/utils/auth";

interface UseCommentOptions {
  projectId: number;
  substepId: string;
  stepId: number;
  projectSubstepId?: number;
  activeTab?: string;
  isCommentMode?: boolean;
  setIsCommentMode?: (value: boolean) => void;
  commentRefreshKey?: number;
}

interface UseCommentReturn {
  isCommentMode: boolean;
  setIsCommentMode: (value: boolean) => void;
  comments: Comment[];
  selectedCommentId: string | number | null;
  showCommentInput: boolean;
  commentPosition: { x: number; y: number } | null;
  inputViewportPosition: { x: number; y: number } | null;
  popoverViewportPosition: { x: number; y: number } | null;
  setSelectedCommentId: (value: string | number | null) => void;
  setShowCommentInput: (value: boolean) => void;
  setCommentPosition: (value: { x: number; y: number } | null) => void;
  setInputViewportPosition: (value: { x: number; y: number } | null) => void;
  setPopoverViewportPosition: (value: { x: number; y: number } | null) => void;
  handleMarkerClick: (commentId: string | number) => void;
  handleSaveComment: (content: string) => void;
  handleDeleteComment: (commentId: string | number) => void;
  handleResolveComment: (commentId: string | number) => void;
  handleReplyComment: (parentId: string | number, content: string) => void;
  handleUpdateCommentPosition: (
    commentId: string | number,
    newPos: { x: number; y: number },
  ) => void;
  handleClosePopover: () => void;
  handleCloseInput: () => void;
  currentComments: Comment[];
  currentUserId: number;
  contentAreaRef: React.RefObject<HTMLDivElement | null>;
}

export function useComment({
  projectId,
  substepId,
  stepId,
  projectSubstepId,
  activeTab,
  isCommentMode: externalIsCommentMode,
  setIsCommentMode: externalSetIsCommentMode,
  commentRefreshKey = 0,
}: UseCommentOptions): UseCommentReturn {
  const [internalIsCommentMode, internalSetIsCommentMode] = useState(false);
  const [comments, setComments] = useState<Comment[]>(
    () => getCommentState(projectId, substepId)?.comments || [],
  );
  const [selectedCommentId, setSelectedCommentId] = useState<
    string | number | null
  >(null);
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [commentPosition, setCommentPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [inputViewportPosition, setInputViewportPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [popoverViewportPosition, setPopoverViewportPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);

  const contentAreaRef = useRef<HTMLDivElement>(null);
  const currentUser = getUserInfo();
  const currentUserId = currentUser?.id || 1;
  const currentUserName = currentUser?.name || "Unknown";

  const isCommentMode =
    externalIsCommentMode !== undefined
      ? externalIsCommentMode
      : internalIsCommentMode;
  const setIsCommentMode =
    externalSetIsCommentMode !== undefined
      ? externalSetIsCommentMode
      : internalSetIsCommentMode;

  // 从 API 同步评论（页面加载时）
  useEffect(() => {
    const state = getCommentState(projectId, substepId);
    if (state) {
      setComments(state.comments);
    } else {
      setComments([]);
    }
    if (projectSubstepId) {
      syncCommentsFromApi(projectId, substepId, projectSubstepId).then(
        (syncedComments) => {
          console.log("[useComment] Synced comments:", syncedComments.length);
          setComments(syncedComments);
        },
      );
    }
  }, [projectId, substepId, projectSubstepId]);

  useEffect(() => {
    if (commentRefreshKey > 0) {
      const state = getCommentState(projectId, substepId);
      if (state) {
        setComments(state.comments);
        console.log("[useComment] Refreshed comments:", state.comments.length);
      }
    }
  }, [projectId, substepId, commentRefreshKey]);

  const currentComments = activeTab
    ? getCommentsBySubtask(
        projectId,
        substepId,
        activeTab === "description"
          ? undefined
          : activeTab.replace("subtask-", ""),
      )
    : [];

  const handleMarkerClick = (commentId: string | number) => {
    setSelectedCommentId(commentId);
    const comment = comments.find((c) => c.id === commentId);
    if (!comment || !comment.position) return;
    const rect = contentAreaRef.current?.getBoundingClientRect();
    const scrollTop = contentAreaRef.current?.scrollTop || 0;
    if (!rect) return;
    const viewportPosition = {
      x: rect.left + comment.position.x,
      y: rect.top + comment.position.y - scrollTop,
    };
    setPopoverViewportPosition(viewportPosition);
  };

  const handleSaveComment = useCallback(
    (content: string) => {
      if (!commentPosition || !activeTab) return;

      const subtaskId =
        activeTab === "description"
          ? undefined
          : activeTab.replace("subtask-", "");
      const tempId = `comment-${Date.now()}`;
      const newComment: Comment = {
        id: tempId,
        projectId,
        stepId,
        substepId,
        subtaskId,
        anchorType: "free",
        position: commentPosition,
        content,
        authorId: currentUserId,
        authorName: currentUserName,
        createdAt: new Date().toISOString(),
        resolved: false,
      };

      addComment(projectId, substepId, newComment);
      setComments((prev) => [...prev, newComment]);

      setShowCommentInput(false);
      setCommentPosition(null);
      setInputViewportPosition(null);
    },
    [
      commentPosition,
      activeTab,
      projectId,
      stepId,
      substepId,
      currentUserId,
      currentUserName,
    ],
  );

  const handleDeleteComment = useCallback(
    async (commentId: string | number) => {
      console.log("[handleDeleteComment] Start deleting:", commentId);

      // 1. 从 localStorage 删除
      deleteComment(projectId, substepId, String(commentId));

      // 2. 立即更新状态（触发重新渲染）
      setComments((prev) => {
        const filtered = prev.filter((c) => c.id !== commentId);
        return filtered;
      });

      // 3. 关闭 popover
      setSelectedCommentId(null);
      setPopoverViewportPosition(null);

      // 4. 从 API 删除
      try {
        await deleteCommentWithApi(projectId, substepId, commentId);

        // 5. 删除后重新同步 API 数据
        if (projectSubstepId && typeof commentId === "number") {
          const synced = await syncCommentsFromApi(
            projectId,
            substepId,
            projectSubstepId,
          );
          setComments(synced);
        }
      } catch (error) {
        console.error("[handleDeleteComment] Delete failed:", error);
        if (projectSubstepId) {
          const synced = await syncCommentsFromApi(
            projectId,
            substepId,
            projectSubstepId,
          );
          setComments(synced);
        }
      }
    },
    [projectId, substepId, projectSubstepId],
  );

  const handleResolveComment = useCallback(
    (commentId: string | number) => {
      updateComment(projectId, substepId, String(commentId), {
        resolved: true,
      });
      setComments((prev) =>
        prev.map((c) => (c.id === commentId ? { ...c, resolved: true } : c)),
      );
    },
    [projectId, substepId],
  );

  const handleReplyComment = useCallback(
    (parentId: string | number, content: string) => {
      const parentComment = comments.find((c) => c.id === parentId);
      const tempId = `comment-${Date.now()}`;
      const reply: Comment = {
        id: tempId,
        projectId,
        stepId,
        substepId,
        subtaskId: parentComment?.subtaskId,
        parentId: typeof parentId === "number" ? parentId : undefined, // 确保是 number 或 undefined
        anchorType: "free",
        content,
        authorId: currentUserId,
        authorName: currentUserName,
        createdAt: new Date().toISOString(),
        resolved: false,
      };

      addComment(projectId, substepId, reply);
      setComments((prev) => [...prev, reply]);
    },
    [comments, projectId, stepId, substepId, currentUserId, currentUserName],
  );

  const handleUpdateCommentPosition = useCallback(
    (commentId: string | number, newPos: { x: number; y: number }) => {
      updateComment(projectId, substepId, String(commentId), {
        position: newPos,
      });
      setComments((prev) =>
        prev.map((c) => (c.id === commentId ? { ...c, position: newPos } : c)),
      );
    },
    [projectId, substepId],
  );

  const handleClosePopover = () => {
    setSelectedCommentId(null);
    setPopoverViewportPosition(null);
  };

  const handleCloseInput = () => {
    setShowCommentInput(false);
    setCommentPosition(null);
    setInputViewportPosition(null);
  };

  return {
    isCommentMode,
    setIsCommentMode,
    comments,
    selectedCommentId,
    showCommentInput,
    commentPosition,
    inputViewportPosition,
    popoverViewportPosition,
    setSelectedCommentId,
    setShowCommentInput,
    setCommentPosition,
    setInputViewportPosition,
    setPopoverViewportPosition,
    handleMarkerClick,
    handleSaveComment,
    handleDeleteComment,
    handleResolveComment,
    handleReplyComment,
    handleUpdateCommentPosition,
    handleClosePopover,
    handleCloseInput,
    currentComments,
    currentUserId,
    contentAreaRef,
  };
}

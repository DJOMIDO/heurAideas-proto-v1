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
  resolveCommentWithApi,
} from "@/utils/commentState";
import { type Comment } from "@/types/comment";
import { getUserInfo } from "@/utils/auth";
import { createComment } from "@/api/comments";

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

  const scrollHandlerRef = useRef<(() => void) | null>(null);

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

  // 监听 activeTab 变化，切换时关闭 popover
  useEffect(() => {
    if (selectedCommentId !== null) {
      console.log("[useComment] Tab changed, closing popover");
      setSelectedCommentId(null);
      setPopoverViewportPosition(null);
    }
  }, [activeTab]);

  useEffect(() => {
    if (!contentAreaRef.current) return;

    const contentArea = contentAreaRef.current;

    // 定义滚动处理函数
    scrollHandlerRef.current = () => {
      if (selectedCommentId === null || !popoverViewportPosition) return;

      const comment = comments.find((c) => c.id === selectedCommentId);
      if (!comment || !comment.position) return;

      const rect = contentArea.getBoundingClientRect();
      const scrollTop = contentArea.scrollTop || 0;

      // 重新计算 popover 位置
      const newViewportPosition = {
        x: rect.left + comment.position.x,
        y: rect.top + comment.position.y - scrollTop,
      };

      setPopoverViewportPosition(newViewportPosition);
    };

    // 监听滚动事件
    contentArea.addEventListener("scroll", scrollHandlerRef.current);

    // 清理
    return () => {
      if (scrollHandlerRef.current) {
        contentArea.removeEventListener("scroll", scrollHandlerRef.current);
      }
    };
  }, [selectedCommentId, popoverViewportPosition, comments]);

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
    async (content: string) => {
      // ✅ 改为 async
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

      // 1. 先保存到 localStorage（现有逻辑，保持 UI 立即响应）
      addComment(projectId, substepId, newComment);
      setComments((prev) => [...prev, newComment]);

      // 2. 如果有 projectSubstepId，直接保存到 API
      if (projectSubstepId) {
        try {
          const result = await createComment({
            projectId,
            projectSubstepId,
            projectStepId: stepId ? Number(stepId) : undefined,
            projectSubtaskCode: subtaskId ? String(subtaskId) : undefined,
            content: newComment.content,
            positionX: newComment.position?.x
              ? Math.round(newComment.position.x)
              : undefined,
            positionY: newComment.position?.y
              ? Math.round(newComment.position.y)
              : undefined,
            anchorType: newComment.anchorType,
            anchorId: newComment.anchorId,
            parentId: undefined, // 新评论没有 parentId
          });

          // 3. 更新 localStorage 中的 ID（从临时 ID 到真实 ID）
          updateComment(projectId, substepId, tempId, {
            id: result.id,
            updatedAt: result.updatedAt,
            subtaskId: (result as any).project_subtask_code || subtaskId,
          });

          // 4. 更新本地 comments 状态
          setComments((prev) =>
            prev.map((c) => (c.id === tempId ? { ...c, id: result.id } : c)),
          );

          console.log("[handleSaveComment] Comment saved to API:", result.id);
        } catch (error) {
          console.error("[handleSaveComment] API save failed:", error);
          // API 失败不影响本地显示，主 Save 按钮会同步
        }
      }

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
      projectSubstepId, // 添加依赖
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
    async (commentId: string | number) => {
      const comment = comments.find((c) => c.id === commentId);
      if (!comment) return;

      // 1. 立即更新 localStorage 和 UI（乐观更新）
      updateComment(projectId, substepId, String(commentId), {
        resolved: true,
      });
      setComments((prev) =>
        prev.map((c) => (c.id === commentId ? { ...c, resolved: true } : c)),
      );

      // 2. 同步到 API
      try {
        await resolveCommentWithApi(projectId, substepId, commentId);

        // 3. 重新加载评论确保一致性
        if (projectSubstepId) {
          const synced = await syncCommentsFromApi(
            projectId,
            substepId,
            projectSubstepId,
          );
          setComments(synced);
        }
      } catch (error) {
        console.error("[handleResolveComment] Failed to resolve:", error);
        // 4. 如果 API 失败，回滚本地状态
        updateComment(projectId, substepId, String(commentId), {
          resolved: false,
        });
        setComments((prev) =>
          prev.map((c) => (c.id === commentId ? { ...c, resolved: false } : c)),
        );
      }
    },
    [projectId, substepId, projectSubstepId, comments],
  );

  // 禁止回复未保存的评论（临时 ID）
  const handleReplyComment = useCallback(
    async (parentId: string | number, content: string) => {
      const parentComment = comments.find((c) => c.id === parentId);
      if (!parentComment || !projectId || !substepId) {
        console.error("[handleReplyComment] Missing required data:", {
          parentComment: !!parentComment,
          projectId,
          substepId,
        });
        return;
      }

      // 检查父评论是否是临时 ID（未保存）
      if (typeof parentId === "string" && parentId.startsWith("comment-")) {
        console.warn("[handleReplyComment] Parent comment not saved yet");
        alert("Please save the comment before replying");
        return;
      }

      const tempId = `comment-${Date.now()}`;
      const reply: Comment = {
        id: tempId,
        projectId,
        stepId,
        substepId,
        subtaskId: parentComment?.subtaskId,
        parentId: parentId,
        anchorType: "free",
        content,
        authorId: currentUserId,
        authorName: currentUserName,
        createdAt: new Date().toISOString(),
        resolved: false,
      };

      // 1. 先添加到本地
      addComment(projectId, substepId, reply);
      setComments((prev) => [...prev, reply]);

      console.log("[handleReplyComment] Reply created locally:", {
        parentId,
        parentIdType: typeof parentId,
        parentCommentId: parentComment.id,
      });

      // 2. 保存到 API
      if (projectSubstepId) {
        try {
          let apiParentId: number | undefined = undefined;
          if (typeof parentId === "number") {
            apiParentId = parentId;
          } else if (
            typeof parentId === "string" &&
            !parentId.startsWith("comment-")
          ) {
            apiParentId = Number(parentId);
          }

          console.log("[handleReplyComment] Calling API:", {
            apiParentId,
            apiParentIdType: typeof apiParentId,
          });

          const result = await createComment({
            projectId,
            projectSubstepId,
            projectStepId: stepId ? Number(stepId) : undefined,
            projectSubtaskCode: reply.subtaskId
              ? String(reply.subtaskId)
              : undefined,
            content: reply.content,
            parentId: apiParentId,
          });

          console.log("[handleReplyComment] API response:", {
            id: result.id,
            parent_id: (result as any).parent_id,
          });

          // 3. 更新 localStorage
          updateComment(projectId, substepId, tempId, {
            id: result.id,
            updatedAt: result.updatedAt,
            subtaskId: (result as any).project_subtask_code || reply.subtaskId,
            parentId: (result as any).parent_id || parentId,
          });

          // 4. 重新加载评论
          const synced = await syncCommentsFromApi(
            projectId,
            substepId,
            projectSubstepId,
          );
          setComments(synced);
        } catch (error) {
          console.error("[handleReplyComment] API save failed:", error);
        }
      }
    },
    [
      comments,
      projectId,
      stepId,
      substepId,
      currentUserId,
      currentUserName,
      projectSubstepId,
    ],
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

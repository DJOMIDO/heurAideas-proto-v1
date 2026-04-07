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
import {
  createComment,
  updateComment as updateCommentApi,
} from "@/api/comments";

type PopoverAlign = "bottom" | "top" | "right" | "left";

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
  popoverAlign?: PopoverAlign;
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
  handleEditComment: (commentId: string | number, content: string) => void;
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
  const [popoverAlign, setPopoverAlign] = useState<PopoverAlign>("bottom");

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
          setComments(syncedComments);
        },
      );
    }
  }, [projectId, substepId, projectSubstepId]);

  useEffect(() => {
    if (commentRefreshKey > 0 && projectSubstepId) {
      // 从 API 同步最新评论
      syncCommentsFromApi(projectId, substepId, projectSubstepId)
        .then((syncedComments) => {
          setComments(syncedComments);
        })
        .catch((error) => {
          console.error("useComment: sync failed:", error);
          // 降级：从 localStorage 读取
          const state = getCommentState(projectId, substepId);
          if (state) {
            setComments(state.comments);
          }
        });
    }
  }, [projectId, substepId, projectSubstepId, commentRefreshKey]);

  // 监听 activeTab 变化，切换时关闭 popover
  useEffect(() => {
    if (selectedCommentId !== null) {
      setSelectedCommentId(null);
      setPopoverViewportPosition(null);
    }
  }, [activeTab]);

  const calculatePopoverPosition = useCallback(
    (
      comment: Comment,
      contentArea: HTMLElement,
      scrollTop: number,
    ): { align: PopoverAlign; position: { x: number; y: number } } => {
      const rect = contentArea.getBoundingClientRect();

      // Marker 相对于容器内容区的坐标
      const markerX = comment.position!.x;
      const markerY = comment.position!.y - scrollTop;

      // Marker 的视口坐标（用于 Popover 定位）
      const markerViewportX = rect.left + markerX;
      const markerViewportY = rect.top + markerY;

      // 容器尺寸
      const containerWidth = rect.width;
      const containerHeight = rect.height;

      // Popover 预估尺寸
      const popoverWidth = 384; // w-96 = 384px
      const popoverHeight = 500; // 预估最大高度

      // 边缘检测阈值（基于容器内坐标）
      const horizontalMargin = 200;
      const verticalMargin = 300;

      let align: PopoverAlign = "bottom";
      let viewportPosition: { x: number; y: number };

      // 1. 检测是否在底部边缘 → 上方显示
      if (markerY > containerHeight - verticalMargin) {
        align = "top";
        viewportPosition = {
          x: markerViewportX,
          y: markerViewportY - popoverHeight,
        };
      }
      // 2. 检测是否在右边缘 → 左边显示
      else if (markerX > containerWidth - horizontalMargin) {
        align = "left";
        viewportPosition = {
          x: markerViewportX - popoverWidth + 150,
          y: markerViewportY - 125,
        };
      }
      // 3. 检测是否在左边缘 → 右边显示
      else if (markerX < horizontalMargin) {
        align = "right";
        viewportPosition = {
          x: markerViewportX + 10,
          y: markerViewportY,
        };
      }
      // 4. 默认：下方显示
      else {
        align = "bottom";
        viewportPosition = {
          x: markerViewportX,
          y: markerViewportY,
        };
      }

      return { align, position: viewportPosition };
    },
    [],
  );

  useEffect(() => {
    if (!contentAreaRef.current) return;

    const contentArea = contentAreaRef.current;

    scrollHandlerRef.current = () => {
      if (selectedCommentId === null || !popoverViewportPosition) return;

      const comment = comments.find((c) => c.id === selectedCommentId);
      if (!comment || !comment.position) return;

      const scrollTop = contentArea.scrollTop || 0;

      // 使用公共函数计算位置
      const { align, position } = calculatePopoverPosition(
        comment,
        contentArea,
        scrollTop,
      );

      setPopoverAlign(align);
      setPopoverViewportPosition(position);
    };

    contentArea.addEventListener("scroll", scrollHandlerRef.current);

    return () => {
      if (scrollHandlerRef.current) {
        contentArea.removeEventListener("scroll", scrollHandlerRef.current);
      }
    };
  }, [
    selectedCommentId,
    popoverViewportPosition,
    comments,
    calculatePopoverPosition,
  ]);

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
    const contentArea = contentAreaRef.current;
    if (!contentArea) return;

    const scrollTop = contentArea.scrollTop || 0;

    // 使用公共函数计算位置
    const { align, position } = calculatePopoverPosition(
      comment,
      contentArea,
      scrollTop,
    );

    setPopoverAlign(align);
    setPopoverViewportPosition(position);
  };

  const handleSaveComment = useCallback(
    async (content: string) => {
      // 改为 async
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
      // 1. 收集所有次级回复 ID（级联删除）
      const collectReplyIds = (
        parentId: string | number,
      ): (string | number)[] => {
        const replyIds: (string | number)[] = [];
        const directReplies = comments.filter((c) => c.parentId === parentId);

        directReplies.forEach((reply) => {
          replyIds.push(reply.id);
          replyIds.push(...collectReplyIds(reply.id)); // 递归
        });

        return replyIds;
      };

      const allReplyIds = collectReplyIds(commentId);
      const idsToDelete = [commentId, ...allReplyIds];

      // 2. 从 localStorage 删除主评论和所有次级回复
      idsToDelete.forEach((id) => {
        deleteComment(projectId, substepId, String(id));
      });

      // 3. 立即更新状态
      setComments((prev) => {
        const idsSet = new Set(idsToDelete);
        return prev.filter((c) => !idsSet.has(c.id));
      });

      // 4. 关闭 popover（如果删除的是当前选中的评论）
      if (selectedCommentId === commentId) {
        setSelectedCommentId(null);
        setPopoverViewportPosition(null);
      }

      // 5. 从 API 删除
      try {
        // 删除主评论
        await deleteCommentWithApi(projectId, substepId, commentId);

        // 级联删除次级回复
        for (const replyId of allReplyIds) {
          if (typeof replyId === "number") {
            await deleteCommentWithApi(projectId, substepId, replyId).catch(
              () => {
                console.warn(
                  "[handleDeleteComment] Failed to delete reply:",
                  replyId,
                );
              },
            );
          }
        }

        // 6. 重新同步
        if (projectSubstepId) {
          const synced = await syncCommentsFromApi(
            projectId,
            substepId,
            projectSubstepId,
          );
          setComments(synced);
        }
      } catch (error) {
        console.error("[handleDeleteComment] Delete failed:", error);
        // 7. 失败后重新同步
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
    [projectId, substepId, projectSubstepId, comments, selectedCommentId],
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

  const handleEditComment = useCallback(
    async (commentId: string | number, newContent: string) => {
      const comment = comments.find((c) => c.id === commentId);
      if (!comment || !projectId || !substepId) {
        console.error("[handleEditComment] Missing required data");
        return;
      }

      // 1. 立即更新 localStorage 和 UI（乐观更新）
      updateComment(projectId, substepId, String(commentId), {
        content: newContent,
        edited: true,
      });
      setComments((prev) =>
        prev.map((c) =>
          c.id === commentId ? { ...c, content: newContent, edited: true } : c,
        ),
      );

      // 2. 同步到 API（只有已同步的评论）
      if (typeof commentId === "number" && projectSubstepId) {
        try {
          await updateCommentApi(commentId, {
            content: newContent,
          });

          // 3. 重新加载评论确保一致性
          const synced = await syncCommentsFromApi(
            projectId,
            substepId,
            projectSubstepId,
          );
          setComments(synced);
        } catch (error) {
          console.error("[handleEditComment] API update failed:", error);
          // 4. API 失败回滚
          updateComment(projectId, substepId, String(commentId), {
            content: comment.content,
            edited: comment.edited,
          });
          setComments((prev) =>
            prev.map((c) =>
              c.id === commentId
                ? { ...c, content: comment.content, edited: comment.edited }
                : c,
            ),
          );
        }
      }
    },
    [comments, projectId, substepId, projectSubstepId],
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
    popoverAlign,
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
    handleEditComment,
    handleUpdateCommentPosition,
    handleClosePopover,
    handleCloseInput,
    currentComments,
    currentUserId,
    contentAreaRef,
  };
}

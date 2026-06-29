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
      syncCommentsFromApi(projectId, substepId, projectSubstepId)
        .then((syncedComments) => {
          setComments(syncedComments);
        })
        .catch((error) => {
          console.error("useComment: sync failed:", error);
          const state = getCommentState(projectId, substepId);
          if (state) {
            setComments(state.comments);
          }
        });
    }
  }, [projectId, substepId, projectSubstepId, commentRefreshKey]);

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

      const markerX = comment.position!.x;
      const markerY = comment.position!.y - scrollTop;

      const markerViewportX = rect.left + markerX;
      const markerViewportY = rect.top + markerY;

      const containerWidth = rect.width;
      const containerHeight = rect.height;

      const popoverWidth = 384;
      const popoverHeight = 500;

      const horizontalMargin = 200;
      const verticalMargin = 300;

      let align: PopoverAlign = "bottom";
      let viewportPosition: { x: number; y: number };

      if (markerY > containerHeight - verticalMargin) {
        align = "top";
        viewportPosition = {
          x: markerViewportX,
          y: markerViewportY - popoverHeight,
        };
      }

      else if (markerX > containerWidth - horizontalMargin) {
        align = "left";
        viewportPosition = {
          x: markerViewportX - popoverWidth + 150,
          y: markerViewportY - 125,
        };
      }

      else if (markerX < horizontalMargin) {
        align = "right";
        viewportPosition = {
          x: markerViewportX + 10,
          y: markerViewportY,
        };
      }

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
            parentId: undefined,
          });

          updateComment(projectId, substepId, tempId, {
            id: result.id,
            updatedAt: result.updatedAt,
            subtaskId: (result as any).project_subtask_code || subtaskId,
          });

          setComments((prev) =>
            prev.map((c) => (c.id === tempId ? { ...c, id: result.id } : c)),
          );
        } catch (error) {
          console.error("[handleSaveComment] API save failed:", error);
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
      projectSubstepId,
    ],
  );

  const handleDeleteComment = useCallback(
    async (commentId: string | number) => {
      const collectReplyIds = (
        parentId: string | number,
      ): (string | number)[] => {
        const replyIds: (string | number)[] = [];
        const directReplies = comments.filter((c) => c.parentId === parentId);

        directReplies.forEach((reply) => {
          replyIds.push(reply.id);
          replyIds.push(...collectReplyIds(reply.id));
        });

        return replyIds;
      };

      const allReplyIds = collectReplyIds(commentId);
      const idsToDelete = [commentId, ...allReplyIds];

      idsToDelete.forEach((id) => {
        deleteComment(projectId, substepId, String(id));
      });

      setComments((prev) => {
        const idsSet = new Set(idsToDelete);
        return prev.filter((c) => !idsSet.has(c.id));
      });

      if (selectedCommentId === commentId) {
        setSelectedCommentId(null);
        setPopoverViewportPosition(null);
      }

      try {
        await deleteCommentWithApi(projectId, substepId, commentId);

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

      updateComment(projectId, substepId, String(commentId), {
        resolved: true,
      });
      setComments((prev) =>
        prev.map((c) => (c.id === commentId ? { ...c, resolved: true } : c)),
      );

      try {
        await resolveCommentWithApi(projectId, substepId, commentId);

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

      addComment(projectId, substepId, reply);
      setComments((prev) => [...prev, reply]);

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

          updateComment(projectId, substepId, tempId, {
            id: result.id,
            updatedAt: result.updatedAt,
            subtaskId: (result as any).project_subtask_code || reply.subtaskId,
            parentId: (result as any).parent_id || parentId,
          });

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

      updateComment(projectId, substepId, String(commentId), {
        content: newContent,
        edited: true,
      });
      setComments((prev) =>
        prev.map((c) =>
          c.id === commentId ? { ...c, content: newContent, edited: true } : c,
        ),
      );

      if (typeof commentId === "number" && projectSubstepId) {
        try {
          await updateCommentApi(commentId, {
            content: newContent,
          });

          const synced = await syncCommentsFromApi(
            projectId,
            substepId,
            projectSubstepId,
          );
          setComments(synced);
        } catch (error) {
          console.error("[handleEditComment] API update failed:", error);
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

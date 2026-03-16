// frontend/src/hooks/useComment.ts

import { useState, useEffect, useRef } from "react";
import {
  getCommentState,
  addComment,
  deleteComment,
  updateComment,
  getCommentsBySubtask,
} from "@/utils/commentState";
import { type Comment } from "@/types/comment";
import { getUserInfo } from "@/utils/auth";

interface UseCommentOptions {
  projectId: number;
  substepId: string;
  stepId: number;
  activeTab?: string;
  isCommentMode?: boolean;
  setIsCommentMode?: (value: boolean) => void;
}

interface UseCommentReturn {
  // 状态
  isCommentMode: boolean;
  setIsCommentMode: (value: boolean) => void;
  comments: Comment[];
  selectedCommentId: string | null;
  showCommentInput: boolean;
  commentPosition: { x: number; y: number } | null;
  inputViewportPosition: { x: number; y: number } | null;
  popoverViewportPosition: { x: number; y: number } | null;

  // setter 函数
  setSelectedCommentId: (value: string | null) => void;
  setShowCommentInput: (value: boolean) => void;
  setCommentPosition: (value: { x: number; y: number } | null) => void;
  setInputViewportPosition: (value: { x: number; y: number } | null) => void;
  setPopoverViewportPosition: (value: { x: number; y: number } | null) => void;

  // 操作函数
  handleMarkerClick: (commentId: string) => void;
  handleSaveComment: (content: string) => void;
  handleDeleteComment: (commentId: string) => void;
  handleResolveComment: (commentId: string) => void;
  handleReplyComment: (parentId: string, content: string) => void;
  handleUpdateCommentPosition: (
    commentId: string,
    newPos: { x: number; y: number },
  ) => void;
  handleClosePopover: () => void;
  handleCloseInput: () => void;

  // 计算值
  currentComments: Comment[];
  currentUserId: number;
  contentAreaRef: React.RefObject<HTMLDivElement | null>;
}

export function useComment({
  projectId,
  substepId,
  stepId,
  activeTab,
  isCommentMode: externalIsCommentMode,
  setIsCommentMode: externalSetIsCommentMode,
}: UseCommentOptions): UseCommentReturn {
  // 内部状态（如果没有外部传入则使用）
  const [internalIsCommentMode, internalSetIsCommentMode] = useState(false);
  const [comments, setComments] = useState<Comment[]>(
    () => getCommentState(projectId, substepId)?.comments || [],
  );
  const [selectedCommentId, setSelectedCommentId] = useState<string | null>(
    null,
  );
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

  // 使用外部传入的或内部的 isCommentMode
  const isCommentMode =
    externalIsCommentMode !== undefined
      ? externalIsCommentMode
      : internalIsCommentMode;

  const setIsCommentMode =
    externalSetIsCommentMode !== undefined
      ? externalSetIsCommentMode
      : internalSetIsCommentMode;

  // 监听评论状态变化
  useEffect(() => {
    const state = getCommentState(projectId, substepId);
    if (state) {
      setComments(state.comments);
    } else {
      setComments([]);
    }
  }, [projectId, substepId]);

  // 获取当前 tab 的评论
  const currentComments = activeTab
    ? getCommentsBySubtask(
        projectId,
        substepId,
        activeTab === "description"
          ? undefined
          : activeTab.replace("subtask-", ""),
      )
    : [];

  // 处理点击 Marker
  const handleMarkerClick = (commentId: string) => {
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

  // 保存评论
  const handleSaveComment = (content: string) => {
    if (!commentPosition || !activeTab) return;

    const subtaskId =
      activeTab === "description"
        ? undefined
        : activeTab.replace("subtask-", "");

    const newComment: Comment = {
      id: `comment-${Date.now()}`,
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
  };

  // 删除评论
  const handleDeleteComment = (commentId: string) => {
    deleteComment(projectId, substepId, commentId);
    setComments((prev) => prev.filter((c) => c.id !== commentId));
    setSelectedCommentId(null);
  };

  // 解决评论
  const handleResolveComment = (commentId: string) => {
    updateComment(projectId, substepId, commentId, { resolved: true });
    setComments((prev) =>
      prev.map((c) => (c.id === commentId ? { ...c, resolved: true } : c)),
    );
  };

  // 回复评论
  const handleReplyComment = (parentId: string, content: string) => {
    const parentComment = comments.find((c) => c.id === parentId);
    const reply: Comment = {
      id: `comment-${Date.now()}`,
      projectId,
      stepId,
      substepId,
      subtaskId: parentComment?.subtaskId,
      parentId,
      anchorType: "free",
      content,
      authorId: currentUserId,
      authorName: currentUserName,
      createdAt: new Date().toISOString(),
      resolved: false,
    };

    addComment(projectId, substepId, reply);
    setComments((prev) => [...prev, reply]);
  };

  // 更新评论位置
  const handleUpdateCommentPosition = (
    commentId: string,
    newPos: { x: number; y: number },
  ) => {
    updateComment(projectId, substepId, commentId, { position: newPos });
    setComments((prev) =>
      prev.map((c) => (c.id === commentId ? { ...c, position: newPos } : c)),
    );
  };

  // 关闭弹窗
  const handleClosePopover = () => {
    setSelectedCommentId(null);
    setPopoverViewportPosition(null);
  };

  // 关闭输入框
  const handleCloseInput = () => {
    setShowCommentInput(false);
    setCommentPosition(null);
    setInputViewportPosition(null);
  };

  return {
    // 状态
    isCommentMode,
    setIsCommentMode,
    comments,
    selectedCommentId,
    showCommentInput,
    commentPosition,
    inputViewportPosition,
    popoverViewportPosition,

    // setter 函数
    setSelectedCommentId,
    setShowCommentInput,
    setCommentPosition,
    setInputViewportPosition,
    setPopoverViewportPosition,

    // 操作函数
    handleMarkerClick,
    handleSaveComment,
    handleDeleteComment,
    handleResolveComment,
    handleReplyComment,
    handleUpdateCommentPosition,
    handleClosePopover,
    handleCloseInput,

    // 计算值
    currentComments,
    currentUserId,
    contentAreaRef,
  };
}

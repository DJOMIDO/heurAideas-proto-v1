// src/pages/substep-comments/CommentListItem.tsx

import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MessageSquare,
  MoreVertical,
  Edit,
  Trash2,
  CheckCircle,
} from "lucide-react";

interface CommentListItemProps {
  comment: any;
  isParent: boolean;
  depth?: number;
  replyingTo: string | number | null;
  setReplyingTo: (id: string | number | null) => void;
  replyContent: string;
  setReplyContent: (content: string) => void;
  onReply: (parentId: string | number, content: string) => void;
  onEdit?: (commentId: string | number, content: string) => void;
  onDelete?: (commentId: string | number) => void;
  onResolve?: (commentId: string | number) => void;
  isSubmittingReply: boolean;
  currentUserId?: number;
}

export default function CommentListItem({
  comment,
  depth = 0,
  replyingTo,
  setReplyingTo,
  replyContent,
  setReplyContent,
  onReply,
  onEdit,
  onDelete,
  onResolve,
  isSubmittingReply,
  currentUserId,
}: CommentListItemProps) {
  // 兼容 snake_case 和 camelCase 字段名
  const authorName = comment.author_name ?? comment.authorName ?? "Unknown";
  const createdAt =
    comment.created_at ?? comment.createdAt ?? new Date().toISOString();
  const authorId = comment.author_id ?? comment.authorId;
  const isEdited = comment.is_edited ?? comment.edited ?? false;

  // 处理头像首字母（兼容两种字段名）
  const getInitials = (name: string) => {
    if (!name || name === "Unknown") return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const initials = getInitials(authorName);

  // 兼容 resolved/deleted 字段
  const isResolved = comment.is_resolved ?? comment.resolved ?? false;
  const isDeleted = comment.is_deleted ?? comment.deleted ?? false;

  // 编辑状态
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);

  if (isDeleted) {
    return null;
  }

  // 修复日期解析（兼容多种格式）
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "Unknown";

    // 尝试解析日期
    let date: Date;
    try {
      date = new Date(dateString);
      if (isNaN(date.getTime())) {
        // 如果解析失败，尝试添加 'Z' 后缀（UTC 时间）
        date = new Date(dateString + "Z");
      }
      if (isNaN(date.getTime())) {
        return "Invalid Date";
      }
    } catch (e) {
      return "Invalid Date";
    }

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleSubmitReply = () => {
    if (replyContent.trim() && replyingTo === comment.id) {
      onReply(comment.id, replyContent.trim());
    }
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
    setReplyContent("");
  };

  const handleStartReply = () => {
    setReplyingTo(comment.id);
    setReplyContent("");
  };

  // 编辑相关函数
  const handleStartEdit = () => {
    setIsEditing(true);
    setEditContent(comment.content);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditContent(comment.content);
  };

  const handleSaveEdit = () => {
    if (editContent.trim() && onEdit) {
      onEdit(comment.id, editContent.trim());
      setIsEditing(false);
    }
  };

  // 根据 depth 显示不同的删除确认信息
  const handleDelete = () => {
    const isReply = depth > 0;
    if (
      confirm(
        `Are you sure you want to delete this ${isReply ? "reply" : "comment"}?`,
      )
    ) {
      onDelete?.(comment.id);
    }
  };

  // Resolve 函数（只在主评论时调用）
  const handleResolve = () => {
    onResolve?.(comment.id);
  };

  // 根据深度调整样式
  const depthStyles = {
    padding: depth === 0 ? "1rem" : "0.75rem 1rem",
    backgroundColor: depth > 0 && depth % 2 === 1 ? "#f9fafb" : "transparent",
  };

  const isMainComment = depth === 0;

  return (
    <div className={`p-4 ${depth === 0 ? "" : "py-3"}`} style={depthStyles}>
      <div className="flex items-start gap-3">
        <Avatar className="h-10 w-10">
          <AvatarFallback
            className={
              isResolved
                ? "bg-green-100 text-green-700"
                : "bg-blue-100 text-blue-700"
            }
          >
            {initials}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-gray-900">{authorName}</span>

            {isResolved && (
              <Badge
                variant="secondary"
                className="bg-green-100 text-green-700"
              >
                Resolved
              </Badge>
            )}

            {comment.project_subtask_code && (
              <Badge variant="outline" className="text-xs">
                {comment.project_subtask_code}
              </Badge>
            )}

            <span className="text-xs text-gray-500">
              {formatDate(createdAt)}
            </span>

            {/* 显示回复层级 */}
            {depth > 0 && (
              <Badge variant="outline" className="text-xs text-gray-400">
                Reply {depth > 1 ? `L${depth}` : ""}
              </Badge>
            )}

            {/* 编辑标识 */}
            {isEdited && (
              <span className="text-xs text-gray-400 italic">(edited)</span>
            )}

            {/* 编辑/删除按钮（只有作者可见） */}
            {currentUserId && authorId === currentUserId && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
                  >
                    <MoreVertical className="w-3 h-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={handleStartEdit}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleDelete}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Resolve 按钮只在主评论时显示（depth === 0） */}
            {isMainComment && !isResolved && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResolve}
                className="h-6 w-6 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                title="Mark as resolved"
              >
                <CheckCircle className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* 评论内容 - 可编辑 */}
          {isEditing ? (
            <div className="mt-2 space-y-2">
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                    handleSaveEdit();
                  } else if (e.key === "Escape") {
                    handleCancelEdit();
                  }
                }}
                autoFocus
                className="min-h-[100px] text-sm"
              />
              <div className="flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={handleCancelEdit}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveEdit}
                  disabled={!editContent.trim()}
                >
                  Save
                </Button>
              </div>
            </div>
          ) : (
            <p className="mt-2 text-sm text-gray-700 whitespace-pre-wrap">
              {comment.content}
            </p>
          )}

          <div className="mt-3 flex items-center gap-2">
            {/* 回复按钮和输入框（限制最大深度为 3） */}
            {depth < 3 &&
              (replyingTo === comment.id ? (
                <div className="flex-1 space-y-2">
                  <Textarea
                    placeholder="Write a reply... (Ctrl/Cmd+Enter to send)"
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                        handleSubmitReply();
                      } else if (e.key === "Escape") {
                        handleCancelReply();
                      }
                    }}
                    autoFocus
                    className="min-h-[60px] text-sm"
                    disabled={isSubmittingReply}
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCancelReply}
                      disabled={isSubmittingReply}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSubmitReply}
                      disabled={!replyContent.trim() || isSubmittingReply}
                    >
                      {isSubmittingReply ? "Sending..." : "Reply"}
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleStartReply}
                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Reply
                </Button>
              ))}

            {depth >= 3 && (
              <span className="text-xs text-gray-400 italic">
                (Max reply depth reached)
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

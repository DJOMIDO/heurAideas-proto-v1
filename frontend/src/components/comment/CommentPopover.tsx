// frontend/src/components/comment/CommentPopover.tsx

import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreVertical,
  Trash2,
  CheckCircle,
  MessageSquare,
  X,
  Edit,
} from "lucide-react";
import { type Comment } from "@/types/comment";

interface CommentPopoverProps {
  comment: Comment;
  position: { x: number; y: number };
  onClose: () => void;
  onDelete: (commentId: string | number) => void;
  onResolve: (commentId: string | number) => void;
  onReply?: (parentId: string | number, content: string) => void;
  onEdit?: (commentId: string | number, content: string) => void;
  replies?: Comment[];
  currentUserId: number;
}

export default function CommentPopover({
  comment,
  position,
  onClose,
  onDelete,
  onResolve,
  onReply,
  onEdit,
  replies = [],
  currentUserId,
}: CommentPopoverProps) {
  if (
    !position ||
    typeof position.x !== "number" ||
    typeof position.y !== "number"
  ) {
    return null;
  }

  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | number | null>(null);

  // 编辑状态
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [editContent, setEditContent] = useState("");

  const handleSubmitReply = (parentId: string | number) => {
    if (replyContent.trim() && replyingTo === parentId && onReply) {
      onReply(parentId, replyContent.trim());
      setReplyContent("");
      setShowReplyInput(false);
      setReplyingTo(null);
    }
  };

  const handleCancelReply = () => {
    setReplyContent("");
    setShowReplyInput(false);
    setReplyingTo(null);
  };

  const handleStartReply = (commentId: string | number) => {
    setReplyingTo(commentId);
    setReplyContent("");
    setShowReplyInput(true);
  };

  // 编辑相关函数
  const handleStartEdit = (commentId: string | number, content: string) => {
    setEditingId(commentId);
    setEditContent(content);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditContent("");
  };

  const handleSaveEdit = (commentId: string | number) => {
    if (editContent.trim() && onEdit) {
      onEdit(commentId, editContent.trim());
      setEditingId(null);
      setEditContent("");
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const initials = comment.authorName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  // 从扁平数组构建回复树
  const buildReplyTree = (
    parentId: string | number,
    allReplies: Comment[],
    depth: number = 1,
  ): Comment[] => {
    const directReplies = allReplies.filter((r) => r.parentId === parentId);

    return directReplies.map((reply) => ({
      ...reply,
      replies: buildReplyTree(reply.id, allReplies, depth + 1),
    }));
  };

  // 递归渲染回复组件
  const renderReply = (reply: Comment, depth: number = 1) => {
    const replyInitials = reply.authorName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

    const hasNestedReplies = reply.replies && reply.replies.length > 0;
    const canReply = depth < 3;

    return (
      <div key={reply.id} className="space-y-3">
        <div
          className="flex gap-2"
          style={{
            paddingLeft: depth > 1 ? "1rem" : "0",
            borderLeft: depth > 1 ? "2px solid #e5e7eb" : "none",
            marginLeft: depth > 1 ? "0.5rem" : "0",
          }}
        >
          <Avatar className="h-6 w-6 flex-shrink-0">
            <AvatarFallback className="text-xs bg-gray-500 text-white">
              {replyInitials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-medium text-gray-900">
                {reply.authorName}
              </span>
              <span className="text-xs text-gray-500">
                {formatDate(reply.createdAt)}
              </span>
              {depth > 1 && (
                <span className="text-xs text-gray-400">L{depth}</span>
              )}

              {/* 添加编辑/删除按钮（只有作者可见） */}
              {reply.authorId === currentUserId && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 w-5 p-0 text-gray-400 hover:text-gray-600"
                    >
                      <MoreVertical className="w-3 h-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => handleStartEdit(reply.id, reply.content)}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        if (
                          confirm("Are you sure you want to delete this reply?")
                        ) {
                          onDelete(reply.id);
                        }
                      }}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            {/* 回复内容 - 可编辑 */}
            {editingId === reply.id ? (
              <div className="space-y-2 mt-1">
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                      handleSaveEdit(reply.id);
                    } else if (e.key === "Escape") {
                      handleCancelEdit();
                    }
                  }}
                  autoFocus
                  className="min-h-[80px] text-sm"
                />
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCancelEdit}
                    className="h-7 text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleSaveEdit(reply.id)}
                    disabled={!editContent.trim()}
                    className="h-7 text-xs"
                  >
                    Save
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">
                {reply.content}
                {reply.edited && (
                  <span className="text-xs text-gray-400 ml-2">(edited)</span>
                )}
              </p>
            )}

            <div className="mt-2 flex items-center gap-2">
              {canReply && replyingTo === reply.id ? (
                <div className="flex-1 space-y-2">
                  <Textarea
                    placeholder="Write a reply..."
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                        handleSubmitReply(reply.id);
                      } else if (e.key === "Escape") {
                        handleCancelReply();
                      }
                    }}
                    autoFocus
                    className="min-h-[50px] text-xs"
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCancelReply}
                      className="h-7 text-xs"
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleSubmitReply(reply.id)}
                      disabled={!replyContent.trim()}
                      className="h-7 text-xs"
                    >
                      Reply
                    </Button>
                  </div>
                </div>
              ) : (
                canReply && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleStartReply(reply.id)}
                    className="h-6 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                  >
                    <MessageSquare className="w-3 h-3 mr-1" />
                    Reply
                  </Button>
                )
              )}

              {!canReply && (
                <span className="text-xs text-gray-400 italic">
                  (Max depth)
                </span>
              )}
            </div>
          </div>
        </div>

        {hasNestedReplies && (
          <div className="space-y-3">
            {reply.replies!.map((nestedReply) =>
              renderReply(nestedReply, depth + 1),
            )}
          </div>
        )}
      </div>
    );
  };

  // 构建回复树
  const replyTree = buildReplyTree(comment.id, replies);

  return (
    <div
      className="fixed z-50 animate-in fade-in slide-in-from-bottom-2 duration-200"
      style={{
        left: position.x,
        top: position.y,
        transform: "translate(-50%, -100%)",
        marginTop: "-40px",
      }}
    >
      <Card className="w-96 shadow-xl border-gray-200">
        {/* 外层容器必须有 max-h-[70vh] + overflow: 'hidden' */}
        <div
          className="flex flex-col"
          style={{ maxHeight: "70vh", overflow: "hidden" }}
        >
          {/* 头部 - flex-shrink-0 */}
          <div className="p-4 space-y-3 flex-shrink-0">
            {/* 主评论头部 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs bg-blue-500 text-white">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {comment.authorName}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatDate(comment.createdAt)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {!comment.resolved && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onResolve(comment.id)}
                    className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                    title="Mark as resolved"
                  >
                    <CheckCircle className="w-4 h-4" />
                  </Button>
                )}

                {comment.authorId === currentUserId && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() =>
                          handleStartEdit(comment.id, comment.content)
                        }
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          if (
                            confirm(
                              "Are you sure you want to delete this comment?",
                            )
                          ) {
                            onDelete(comment.id);
                          }
                        }}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* 主评论内容 - 可编辑 */}
            {editingId === comment.id ? (
              <div className="space-y-2">
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                      handleSaveEdit(comment.id);
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
                    onClick={() => handleSaveEdit(comment.id)}
                    disabled={!editContent.trim()}
                  >
                    Save
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-800 whitespace-pre-wrap">
                {comment.content}
                {comment.edited && (
                  <span className="text-xs text-gray-400 ml-2">(edited)</span>
                )}
              </div>
            )}
          </div>

          {/* 回复区域 - 移除 ScrollArea，用原生滚动 */}
          {replyTree.length > 0 && (
            <div
              className="border-t border-gray-100 flex-shrink-0"
              style={{ maxHeight: "300px", overflowY: "auto" }}
            >
              <div className="p-4 space-y-3">
                {replyTree.map((reply) => renderReply(reply, 1))}
              </div>
            </div>
          )}

          {/* 底部 - flex-shrink-0 */}
          <div className="p-4 space-y-3 flex-shrink-0 border-t border-gray-100">
            {showReplyInput && replyingTo === comment.id && (
              <div className="space-y-2">
                <Textarea
                  placeholder={`Write a reply... (Ctrl/Cmd+Enter to send)`}
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                      handleSubmitReply(comment.id);
                    } else if (e.key === "Escape") {
                      handleCancelReply();
                    }
                  }}
                  autoFocus
                  className="min-h-[60px] text-sm"
                />
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="sm" onClick={handleCancelReply}>
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleSubmitReply(comment.id)}
                    disabled={!replyContent.trim()}
                  >
                    Reply
                  </Button>
                </div>
              </div>
            )}

            {!showReplyInput && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleStartReply(comment.id)}
                className="w-full text-blue-600 hover:text-blue-700 hover:bg-blue-50"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Reply
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}

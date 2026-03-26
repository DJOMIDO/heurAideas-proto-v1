// src/pages/substep-comments/CommentListItem.tsx

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare } from "lucide-react";

interface CommentListItemProps {
  comment: any;
  isParent: boolean;
  depth?: number;
  replyingTo: string | number | null;
  setReplyingTo: (id: string | number | null) => void;
  replyContent: string;
  setReplyContent: (content: string) => void;
  onReply: (parentId: string | number, content: string) => void;
  isSubmittingReply: boolean;
}

export default function CommentListItem({
  comment,
  depth = 0,
  replyingTo,
  setReplyingTo,
  replyContent,
  setReplyContent,
  onReply,
  isSubmittingReply,
}: CommentListItemProps) {
  const initials =
    comment.author_name
      ?.split(" ")
      .map((n: string) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "?";

  const isResolved = comment.is_resolved;
  const isDeleted = comment.is_deleted;

  if (isDeleted) {
    return null;
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
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

  // 根据深度调整样式
  const depthStyles = {
    padding: depth === 0 ? "1rem" : "0.75rem 1rem",
    backgroundColor: depth > 0 && depth % 2 === 1 ? "#f9fafb" : "transparent",
  };

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
            <span className="font-medium text-gray-900">
              {comment.author_name}
            </span>

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
              {formatDate(comment.created_at)}
            </span>

            {/* 显示回复层级 */}
            {depth > 0 && (
              <Badge variant="outline" className="text-xs text-gray-400">
                Reply {depth > 1 ? `L${depth}` : ""}
              </Badge>
            )}
          </div>

          <p className="mt-2 text-sm text-gray-700 whitespace-pre-wrap">
            {comment.content}
          </p>

          {/* 回复按钮和输入框（限制最大深度为 3） */}
          <div className="mt-3 flex items-center gap-2">
            {depth < 3 && // 限制最大回复深度
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

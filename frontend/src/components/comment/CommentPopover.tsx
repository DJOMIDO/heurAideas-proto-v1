// frontend/src/components/comment/CommentPopover.tsx

import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
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
} from "lucide-react";
import { type Comment } from "@/types/comment";

interface CommentPopoverProps {
  comment: Comment;
  position: { x: number; y: number };
  onClose: () => void;
  onDelete: () => void;
  onResolve: () => void;
  onReply?: (content: string) => void;
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

  const handleSubmitReply = () => {
    if (replyContent.trim() && onReply) {
      onReply(replyContent.trim());
      setReplyContent("");
      setShowReplyInput(false);
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
        <div className="p-4 space-y-3">
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
                  onClick={onResolve}
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
                      onClick={onDelete}
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

          <div className="text-sm text-gray-800 whitespace-pre-wrap">
            {comment.content}
          </div>

          {replies.length > 0 && (
            <ScrollArea className="max-h-48 border-t border-gray-100 pt-3">
              <div className="space-y-3">
                {replies.map((reply) => (
                  <div key={reply.id} className="flex gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-xs bg-gray-500 text-white">
                        {reply.authorName
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-gray-900">
                          {reply.authorName}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatDate(reply.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 mt-1">
                        {reply.content}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}

          {showReplyInput ? (
            <div className="space-y-2 border-t border-gray-100 pt-3">
              <Textarea
                placeholder={`Write a reply... (Ctrl/Cmd+Enter to send)`}
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && e.metaKey) {
                    handleSubmitReply();
                  } else if (e.key === "Escape") {
                    setShowReplyInput(false);
                  }
                }}
                autoFocus
                className="min-h-[60px] text-sm"
              />
              <div className="flex justify-end gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowReplyInput(false)}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSubmitReply}
                  disabled={!replyContent.trim()}
                >
                  Reply
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowReplyInput(true)}
              className="w-full text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Reply
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}

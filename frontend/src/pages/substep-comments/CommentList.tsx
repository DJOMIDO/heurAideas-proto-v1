// src/pages/substep-comments/CommentList.tsx

import { Separator } from "@/components/ui/separator";
import CommentListItem from "./CommentListItem";

interface CommentListProps {
  comments: any[];
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

export default function CommentList({
  comments,
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
}: CommentListProps) {
  // 递归渲染评论和回复
  const renderComment = (comment: any, depth: number = 0) => {
    const isParent = depth === 0;
    const hasReplies = comment.replies && comment.replies.length > 0;

    return (
      <div key={comment.id}>
        <CommentListItem
          comment={comment}
          isParent={isParent}
          depth={depth}
          replyingTo={replyingTo}
          setReplyingTo={setReplyingTo}
          replyContent={replyContent}
          setReplyContent={setReplyContent}
          onReply={onReply}
          onEdit={onEdit}
          onDelete={onDelete}
          onResolve={onResolve}
          isSubmittingReply={isSubmittingReply}
          currentUserId={currentUserId}
        />

        {/* 递归渲染回复 */}
        {hasReplies && (
          <div
            className="space-y-3"
            style={{
              paddingLeft: depth === 0 ? "3rem" : "1.5rem",
              marginLeft: depth > 0 ? "1rem" : "0",
              borderLeft: depth > 0 ? "2px solid #e5e7eb" : "none",
            }}
          >
            {comment.replies.map((reply: any) =>
              renderComment(reply, depth + 1),
            )}
          </div>
        )}

        {!hasReplies && !isParent && <div className="h-2" />}
      </div>
    );
  };

  return (
    <div className="divide-y divide-gray-100">
      {comments.map((comment, index) => (
        <div key={comment.id}>
          {renderComment(comment, 0)}
          {index < comments.length - 1 && <Separator />}
        </div>
      ))}
    </div>
  );
}

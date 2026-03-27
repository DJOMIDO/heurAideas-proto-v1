// frontend/src/components/comment/CommentOverlay.tsx

import {
  CommentMarker,
  CommentInput,
  CommentPopover,
} from "@/components/comment";
import { type Comment } from "@/types/comment";

interface CommentOverlayProps {
  showCommentInput: boolean;
  inputViewportPosition: { x: number; y: number } | null;
  selectedCommentId: string | number | null;
  popoverViewportPosition: { x: number; y: number } | null;
  comments: Comment[];
  currentComments: Comment[];
  currentUserId: number;
  handleMarkerClick: (commentId: string | number) => void;
  handleSaveComment: (content: string) => void;
  handleCloseInput: () => void;
  handleClosePopover: () => void;
  handleDeleteComment: (commentId: string | number) => void;
  handleResolveComment: (commentId: string | number) => void;
  handleReplyComment: (parentId: string | number, content: string) => void;
  handleEditComment: (commentId: string | number, content: string) => void;
  handleUpdateCommentPosition: (
    commentId: string | number,
    newPos: { x: number; y: number },
  ) => void;
}

export default function CommentOverlay({
  showCommentInput,
  inputViewportPosition,
  selectedCommentId,
  popoverViewportPosition,
  comments,
  currentComments,
  currentUserId,
  handleMarkerClick,
  handleSaveComment,
  handleCloseInput,
  handleClosePopover,
  handleDeleteComment,
  handleResolveComment,
  handleReplyComment,
  handleEditComment,
  handleUpdateCommentPosition,
}: CommentOverlayProps) {
  // 递归查找所有层级的回复
  const findAllReplies = (
    parentId: string | number,
    allComments: Comment[],
  ): Comment[] => {
    const directReplies = allComments.filter((c) => c.parentId === parentId);

    const nestedReplies = directReplies.flatMap((reply) =>
      findAllReplies(reply.id, allComments),
    );

    return [...directReplies, ...nestedReplies];
  };

  return (
    <>
      {currentComments.map(
        (comment) =>
          comment.position && (
            <CommentMarker
              key={comment.id}
              comment={comment}
              position={comment.position}
              onClick={() => handleMarkerClick(comment.id)}
              isSelected={selectedCommentId === comment.id}
              onPositionChange={(newPos) =>
                handleUpdateCommentPosition(comment.id, newPos)
              }
            />
          ),
      )}

      {showCommentInput && inputViewportPosition && (
        <CommentInput
          position={inputViewportPosition}
          onSave={handleSaveComment}
          onCancel={handleCloseInput}
        />
      )}

      {selectedCommentId &&
        popoverViewportPosition &&
        (() => {
          const comment = comments.find((c) => c.id === selectedCommentId);
          if (!comment) return null;

          // 使用递归函数查找所有层级回复
          const allReplies = findAllReplies(selectedCommentId, comments);

          return (
            <CommentPopover
              comment={comment}
              position={popoverViewportPosition}
              onClose={handleClosePopover}
              onDelete={() => handleDeleteComment(selectedCommentId)}
              onResolve={() => handleResolveComment(selectedCommentId)}
              // 修复：传递 handleReplyComment，让 Popover 调用时传入 parentId
              onReply={handleReplyComment}
              onEdit={handleEditComment}
              replies={allReplies}
              currentUserId={currentUserId}
            />
          );
        })()}
    </>
  );
}

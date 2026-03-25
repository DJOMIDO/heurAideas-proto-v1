// frontend/src/components/comment/CommentOverlay.tsx

import {
  CommentMarker,
  CommentInput,
  CommentPopover,
} from "@/components/comment";
import { type Comment } from "@/types/comment";

interface CommentOverlayProps {
  // 状态
  showCommentInput: boolean;
  inputViewportPosition: { x: number; y: number } | null;
  selectedCommentId: string | number | null;
  popoverViewportPosition: { x: number; y: number } | null;
  comments: Comment[];
  currentComments: Comment[];
  currentUserId: number;

  // 操作函数 全部改为 string | number
  handleMarkerClick: (commentId: string | number) => void;
  handleSaveComment: (content: string) => void;
  handleCloseInput: () => void;
  handleClosePopover: () => void;
  handleDeleteComment: (commentId: string | number) => void;
  handleResolveComment: (commentId: string | number) => void;
  handleReplyComment: (parentId: string | number, content: string) => void;
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
  handleUpdateCommentPosition,
}: CommentOverlayProps) {
  return (
    <>
      {/* 评论标记 */}
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

      {/* 评论输入框 */}
      {showCommentInput && inputViewportPosition && (
        <CommentInput
          position={inputViewportPosition}
          onSave={handleSaveComment}
          onCancel={handleCloseInput}
        />
      )}

      {/* 评论详情弹窗 */}
      {selectedCommentId &&
        popoverViewportPosition &&
        (() => {
          const comment = comments.find((c) => c.id === selectedCommentId);
          if (!comment) return null;

          const replies = comments.filter(
            (c) => c.parentId === selectedCommentId,
          );

          return (
            <CommentPopover
              comment={comment}
              position={popoverViewportPosition}
              onClose={handleClosePopover}
              onDelete={() => handleDeleteComment(selectedCommentId)}
              onResolve={() => handleResolveComment(selectedCommentId)}
              onReply={(content) =>
                handleReplyComment(selectedCommentId, content)
              }
              replies={replies}
              currentUserId={currentUserId}
            />
          );
        })()}
    </>
  );
}

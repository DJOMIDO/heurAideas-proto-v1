// src/pages/substep-comments/CommentList.tsx

import { Separator } from "@/components/ui/separator";
import CommentListItem from "./CommentListItem";

interface CommentListProps {
  comments: any[];
}

export default function CommentList({ comments }: CommentListProps) {
  return (
    <div className="divide-y divide-gray-100">
      {comments.map((comment, index) => (
        <div key={comment.id}>
          <CommentListItem comment={comment} isParent={true} />

          {comment.replies && comment.replies.length > 0 && (
            <div className="bg-gray-50 pl-8 pr-4 py-3 space-y-3">
              {comment.replies.map((reply: any) => (
                <CommentListItem
                  key={reply.id}
                  comment={reply}
                  isParent={false}
                />
              ))}
            </div>
          )}

          {index < comments.length - 1 && <Separator />}
        </div>
      ))}
    </div>
  );
}

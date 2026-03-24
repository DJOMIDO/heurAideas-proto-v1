// src/pages/substep-comments/CommentListItem.tsx

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface CommentListItemProps {
  comment: any;
  isParent: boolean;
}

export default function CommentListItem({
  comment,
  isParent,
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

  return (
    <div className={`p-4 ${isParent ? "" : "py-3"}`}>
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
          </div>

          <p className="mt-2 text-sm text-gray-700 whitespace-pre-wrap">
            {comment.content}
          </p>

        </div>
      </div>
    </div>
  );
}

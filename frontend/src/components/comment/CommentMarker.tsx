// frontend/src/components/comment/CommentMarker.tsx

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { type Comment } from "@/types/comment";

interface CommentMarkerProps {
  comment: Comment;
  position: { x: number; y: number };
  onClick: () => void;
  isSelected?: boolean;
}

export default function CommentMarker({
  comment,
  position,
  onClick,
  isSelected = false,
}: CommentMarkerProps) {
  if (
    !position ||
    typeof position.x !== "number" ||
    typeof position.y !== "number"
  ) {
    return null;
  }
  
  const initials = comment.authorName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <button
      onClick={onClick}
      className={`
        absolute z-30 transition-all duration-200
        ${isSelected ? "scale-110" : "scale-100 hover:scale-105"}
      `}
      style={{
        left: position.x,
        top: position.y,
        transform: "translate(-50%, -50%)",
      }}
    >
      <div
        className={`
        relative p-1 rounded-full shadow-lg
        ${
          isSelected
            ? "ring-2 ring-blue-500 ring-offset-2"
            : "hover:ring-2 hover:ring-blue-300 hover:ring-offset-2"
        }
        ${comment.resolved ? "bg-gray-100" : "bg-white"}
      `}
      >
        <Avatar className="h-8 w-8">
          <AvatarFallback className="text-xs bg-blue-500 text-white">
            {initials}
          </AvatarFallback>
        </Avatar>

        {/* 未解决标记 */}
        {!comment.resolved && (
          <span className="absolute -top-1 -right-1 h-3 w-3 bg-blue-500 rounded-full border-2 border-white" />
        )}

        {/* 已解决标记 */}
        {comment.resolved && (
          <span className="absolute -bottom-1 -right-1 h-4 w-4 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
            <svg
              className="w-2.5 h-2.5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </span>
        )}
      </div>
    </button>
  );
}

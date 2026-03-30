// frontend/src/components/comment/CommentModeToggle.tsx

import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";

interface CommentModeToggleProps {
  isEnabled: boolean;
  onToggle: () => void;
  commentCount?: number;
}

export default function CommentModeToggle({
  isEnabled,
  onToggle,
  commentCount = 0,
}: CommentModeToggleProps) {
  return (
    <Button
      variant={isEnabled ? "default" : "outline"}
      size="sm"
      onClick={onToggle}
      className={`
        relative transition-all duration-200
        ${
          isEnabled
            ? "bg-blue-600 hover:bg-blue-700 text-white"
            : "bg-white hover:bg-gray-50 text-gray-700"
        }
      `}
    >
      <MessageSquare className="w-4 h-4 mr-2" />
      {isEnabled ? "Exit Comment Mode" : "Comment Mode"}

      {commentCount > 0 && (
        <span
          className={`
          ml-2 px-2 py-0.5 text-xs rounded-full
          ${isEnabled ? "bg-white/20 text-white" : "bg-blue-100 text-blue-600"}
        `}
        >
          {commentCount}
        </span>
      )}
    </Button>
  );
}

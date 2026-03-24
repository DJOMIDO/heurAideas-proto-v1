// src/pages/substep-comments/CommentHeader.tsx

import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface CommentHeaderProps {
  substepId: string;
  totalComments: number; // 所有评论数
  filteredComments: number; // 当前筛选后的评论数
  filter: "all" | "resolved" | "unresolved";
  onBack: () => void;
}

export default function CommentHeader({
  substepId,
  totalComments,
  filteredComments,
  filter,
  onBack,
}: CommentHeaderProps) {
  // 根据 filter 显示不同的标题
  const getTitle = () => {
    if (filter === "all") {
      return totalComments === 0
        ? `No comments for Substep ${substepId}`
        : `${totalComments} ${totalComments === 1 ? "comment" : "comments"} for Substep ${substepId}`;
    }

    if (filter === "resolved") {
      return filteredComments === 0
        ? `No resolved comments for Substep ${substepId}`
        : `${filteredComments} ${filteredComments === 1 ? "resolved comment" : "resolved comments"} for Substep ${substepId}`;
    }

    // unresolved
    return filteredComments === 0
      ? `No unresolved comments for Substep ${substepId}`
      : `${filteredComments} ${filteredComments === 1 ? "unresolved comment" : "unresolved comments"} for Substep ${substepId}`;
  };

  return (
    <div className="bg-white border-b px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            className="h-10 w-20 p-0"
            onClick={onBack}
            title="Back"
          >
            <ArrowLeft className="w-3 h-3" />
            Back
          </Button>

          <h1 className="text-lg font-semibold text-gray-900">{getTitle()}</h1>
        </div>
      </div>
    </div>
  );
}

// src/pages/substep-comments/CommentHeader.tsx

import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface CommentHeaderProps {
  substepId: string;
  totalComments: number;
  onBack: () => void;
}

export default function CommentHeader({
  substepId,
  totalComments,
  onBack,
}: CommentHeaderProps) {
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

          <h1 className="text-lg font-semibold text-gray-900">
            {totalComments === 0
              ? `No comments for Substep ${substepId}`
              : `${totalComments} ${totalComments === 1 ? "comment" : "comments"} for Substep ${substepId}`}
          </h1>
        </div>
      </div>
    </div>
  );
}

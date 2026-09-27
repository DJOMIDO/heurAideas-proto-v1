// frontend/src/pages/overview/SubstepList.tsx

import { ResizablePanel } from "@/components/ui/resizable";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { type Substep } from "@/data/steps";
import { getUserId } from "@/utils/auth";

interface SubstepListProps {
  substeps: Substep[];
  selectedId: string | null;
  onSelect: (substep: Substep) => void;
  stepId: number;
  commentCountMap?: Record<string, number>;
}

export default function SubstepList({
  substeps,
  selectedId,
  onSelect,
  stepId,
}: SubstepListProps) {
  const navigate = useNavigate();
  const userId = getUserId();
  const storageKey = userId ? `currentProjectId-${userId}` : "currentProjectId";
  const currentProjectId = localStorage.getItem(storageKey) || "1";

  return (
    <ResizablePanel
      defaultSize="25"
      minSize="15"
      maxSize="40"
      className="bg-background"
    >
      <div className="h-full overflow-y-auto p-4">
        <div className="flex flex-col gap-2">
          {substeps.map((substep, index) => (
            <div
              key={substep.id}
              className={`p-3 rounded-lg transition-all border
                ${
                  selectedId === substep.id
                    ? "bg-[#A3B18A]/35 border-[#588157] text-[#344E41] shadow-sm"
                    : "bg-background border-[#A3B18A]/60 hover:bg-[#DAD7CD]/50 hover:border-[#588157]/50"
                }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div
                  onClick={() => onSelect(substep)}
                  className="flex-1 cursor-pointer"
                >
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-semibold text-muted-foreground">
                      Substep {stepId}.{index + 1}
                    </span>
                    <span className="font-medium text-sm text-foreground">
                      {substep.title}
                    </span>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 shrink-0 hover:bg-[#A3B18A]/50"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(
                      `/substep/${currentProjectId}/${stepId}/${substep.id}`,
                    );
                  }}
                  title="Open Substep"
                >
                  <ArrowRight className="w-4 h-4 stroke-4 group-hover:text-blue-600 transition-colors" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </ResizablePanel>
  );
}

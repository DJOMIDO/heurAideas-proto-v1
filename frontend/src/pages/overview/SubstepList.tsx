import { ResizablePanel } from "@/components/ui/resizable";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { type Substep } from "@/data/steps";

interface SubstepListProps {
  substeps: Substep[];
  selectedId: string | null;
  onSelect: (substep: Substep) => void;
  stepId: number;
}

export default function SubstepList({
  substeps,
  selectedId,
  onSelect,
  stepId,
}: SubstepListProps) {
  const navigate = useNavigate();

  return (
    <ResizablePanel
      defaultSize="25"
      minSize="15"
      maxSize="40"
      className="bg-white"
    >
      <div className="h-full overflow-y-auto p-4">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Substeps
        </h3>
        <div className="space-y-2">
          {substeps.map((substep, index) => (
            <div
              key={substep.id}
              className={`p-3 rounded-lg transition-all border
                ${
                  selectedId === substep.id
                    ? "bg-blue-50 border-blue-200 text-blue-700 shadow-sm"
                    : "bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300"
                }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div
                  onClick={() => onSelect(substep)}
                  className="flex-1 cursor-pointer"
                >
                  <div className="flex flex-col gap-1">
                    <span className="text font-semibold text-gray-500">
                      Substep {stepId}.{index + 1}
                    </span>
                    <span className="font-medium text-sm text-gray-900">
                      {substep.title}
                    </span>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 shrink-0 hover:bg-blue-200"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/substep/${stepId}/${substep.id}`);
                  }}
                  title="Open Substep"
                >
                  <ArrowRight
                    className="w-4 h-4 stroke-4 group-hover:text-blue-600 transition-colors"
                  />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </ResizablePanel>
  );
}

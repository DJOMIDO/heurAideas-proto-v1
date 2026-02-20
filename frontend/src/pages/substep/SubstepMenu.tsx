// src/pages/substep/SubstepMenu.tsx

import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save, Redo, Undo } from "lucide-react";
import { type Substep } from "@/data/steps";

interface SubstepMenuProps {
  stepId: number;
  substeps: Substep[];
  currentSubstepId: string;
  onSave?: () => void;
}

export default function SubstepMenu({
  stepId,
  substeps,
  currentSubstepId,
  onSave,
}: SubstepMenuProps) {
  const navigate = useNavigate();

  return (
    <div className="w-auto bg-gray-50 border-r border-gray-200 flex flex-col shrink-0 z-10 h-full">
      {/* 顶部按钮组 */}
      <div className="p-2 border-b border-gray-200 bg-white">
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 h-8 text-xs"
            onClick={() => navigate("/overview")}
            title="Back to Overview"
          >
            <ArrowLeft className="w-3 h-3" />
          </Button>
          <Button
            variant="default"
            size="sm"
            className="flex-1 h-8 text-xs bg-blue-600 hover:bg-blue-700"
            onClick={onSave}
            title="Save Progress"
          >
            <Save className="w-3 h-3" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 h-8 text-xs"
            title="Undo (Ctrl+Z)"
          >
            <Undo className="w-3 h-3" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 h-8 text-xs"
            title="Redo (Ctrl+Y)"
          >
            <Redo className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* 子步骤列表 */}
      <div className="flex-1 flex flex-col overflow-hidden py-2">
        <div className="flex flex-col gap-1 w-full flex-1 p-2">
          {substeps.map((substep) => {
            const isActive = currentSubstepId === substep.id;
            return (
              <button
                key={substep.id}
                onClick={() => navigate(`/substep/${stepId}/${substep.id}`)}
                className={`w-full rounded-lg transition-all duration-200 text-left p-3
                  bg-white border border-gray-200
                  hover:bg-gray-100 hover:border-gray-300
                  ${
                    isActive
                      ? "bg-blue-50 border-blue-300 text-blue-700 font-semibold shadow-sm"
                      : "text-gray-700"
                  }`}
                title={substep.title}
              >
                <span className="font-medium text-sm block text-center">
                  Substep {substep.id}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

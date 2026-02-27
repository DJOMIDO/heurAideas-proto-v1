// src/pages/substep/SubstepMenu.tsx

import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save, CheckCircle2, Clock, Redo, Undo } from "lucide-react";
import { type Substep } from "@/data/steps";

interface SubstepMenuProps {
  stepId: number;
  substeps: Substep[];
  currentSubstepId: string;
  projectId: number;
  onSave?: () => void;
  isSaving?: boolean;
  lastSaved?: string | null;
}

export default function SubstepMenu({
  stepId,
  substeps,
  currentSubstepId,
  projectId,
  onSave,
  isSaving = false,
  lastSaved = null,
}: SubstepMenuProps) {
  const navigate = useNavigate();

  return (
    <div className="w-auto bg-gray-50 border-r border-gray-200 flex flex-col shrink-0 z-10 h-full">
      <div className="p-2 border-b border-gray-200 bg-white">
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 h-8 text-xs"
            onClick={() => navigate(`/overview`)}
            title="Back to Overview"
          >
            <ArrowLeft className="w-3 h-3" />
          </Button>
          <Button
            variant="default"
            size="sm"
            className="flex-1 h-8 text-xs bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            onClick={onSave}
            disabled={isSaving}
            title="Save Progress"
          >
            {isSaving ? (
              <>
                <Clock className="w-3 h-3 animate-spin" />
                <span className="ml-1">Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-3 h-3" />
                <span className="ml-1">Save</span>
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 h-8 text-xs"
            title="Undo (Ctrl+Z)"
            disabled
          >
            <Undo className="w-3 h-3" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 h-8 text-xs"
            title="Redo (Ctrl+Y)"
            disabled
          >
            <Redo className="w-3 h-3" />
          </Button>
        </div>

        {lastSaved && (
          <div className="mt-2 flex items-center gap-1 text-xs text-gray-500">
            <CheckCircle2 className="w-3 h-3 text-green-600" />
            <span>Last saved: {new Date(lastSaved).toLocaleTimeString()}</span>
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col overflow-hidden py-2">
        <div className="flex flex-col gap-1 w-full flex-1 p-2">
          {substeps.map((substep) => {
            const isActive = currentSubstepId === substep.id;
            return (
              <button
                key={substep.id}
                onClick={() =>
                  navigate(`/substep/${projectId}/${stepId}/${substep.id}`)
                }
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

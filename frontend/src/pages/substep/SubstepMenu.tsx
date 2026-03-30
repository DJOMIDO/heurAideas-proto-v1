// src/pages/substep/SubstepMenu.tsx

import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save, CheckCircle2, Clock, Redo, Undo } from "lucide-react";
import { type Substep } from "@/data/steps";
import { useState } from "react";
import "@/styles/animations.css";

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
  isSaving: parentIsSaving = false,
}: SubstepMenuProps) {
  const navigate = useNavigate();

  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "success">(
    "idle",
  );

  const isSaving = saveStatus === "saving" || parentIsSaving;

  const handleSave = async () => {
    setSaveStatus("saving");
    try {
      await onSave?.();
      setSaveStatus("success");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (error) {
      console.error("Save failed:", error);
      setSaveStatus("idle");
    }
  };

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
            variant={saveStatus === "success" ? "default" : "outline"}
            size="sm"
            className={`flex-1 h-8 text-xs transition-all duration-300 ${
              saveStatus === "success"
                ? "bg-green-600 hover:bg-green-700 border-green-600 text-white animate-success-pulse"
                : "border-gray-200 hover:bg-gray-100 hover:border-gray-300 text-gray-700"
            } disabled:opacity-50`}
            onClick={handleSave}
            disabled={isSaving}
            title="Save Progress"
          >
            {saveStatus === "saving" ? (
              <>
                <Clock className="w-3 h-3 animate-spin" />
                <span className="ml">Saving...</span>
              </>
            ) : saveStatus === "success" ? (
              <>
                <CheckCircle2 className="w-3 h-3" />
                <span className="ml">Saved!</span>
              </>
            ) : (
              <>
                <Save className="w-3 h-3" />
                <span className="ml">Save</span>
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

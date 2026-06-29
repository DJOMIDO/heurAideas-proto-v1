// frontend/src/pages/substep/substep-content-card/forms/subtask-1-2-a/MethodologicalFreedomCard.tsx

import type { MethodologicalFreedomType } from "./types";
import { METHODOLOGICAL_FREEDOM_LABELS } from "./types";
import { cn } from "@/lib/utils";

interface MethodologicalFreedomCardProps {
  questionType: MethodologicalFreedomType;
  value: "yes" | "no" | undefined;
  onChange: (value: "yes" | "no") => void;
  isReadOnly?: boolean;
}

export default function MethodologicalFreedomCard({
  questionType,
  value,
  onChange,
  isReadOnly = false,
}: MethodologicalFreedomCardProps) {
  const config = METHODOLOGICAL_FREEDOM_LABELS[questionType];

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 flex items-center justify-between gap-4 shadow-sm">
      <div className="flex-1 space-y-1">
        <h4 className="text-sm font-bold text-gray-900">{config.title}</h4>
        <p className="text-xs text-gray-600 leading-relaxed">
          {config.description}
        </p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          disabled={isReadOnly}
          onClick={() => onChange("yes")}
          className={cn(
            "px-4 py-2 rounded-md text-sm font-medium transition-all border",
            value === "yes"
              ? "bg-green-600 text-white border-green-600 shadow-sm"
              : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50",
          )}
        >
          Yes
        </button>
        <button
          type="button"
          disabled={isReadOnly}
          onClick={() => onChange("no")}
          className={cn(
            "px-4 py-2 rounded-md text-sm font-medium transition-all border",
            value === "no"
              ? "bg-red-600 text-white border-red-600 shadow-sm"
              : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50",
          )}
        >
          No
        </button>
      </div>
    </div>
  );
}

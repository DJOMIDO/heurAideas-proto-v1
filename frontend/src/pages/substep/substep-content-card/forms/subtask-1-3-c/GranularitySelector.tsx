// frontend/src/pages/substep/substep-content-card/forms/subtask-1-3-c/GranularitySelector.tsx

import { GRANULARITY_OPTIONS } from "./types";
import type { Granularity } from "./types";

interface GranularitySelectorProps {
  value: Granularity | null;
  onChange: (value: Granularity) => void;
  isReadOnly?: boolean;
}

export default function GranularitySelector({
  value,
  onChange,
  isReadOnly = false,
}: GranularitySelectorProps) {
  return (
    <div className="flex flex-wrap gap-3">
      {GRANULARITY_OPTIONS.map((option) => {
        const isSelected = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => !isReadOnly && onChange(option.value)}
            disabled={isReadOnly}
            className={`
              px-5 py-3 rounded-lg text-sm font-medium transition-all duration-200 border-2
              ${
                isSelected
                  ? "bg-emerald-50 border-emerald-400 text-emerald-700"
                  : "bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
              }
              ${isReadOnly ? "cursor-default opacity-60" : "cursor-pointer"}
            `}
          >
            <div className="flex flex-col items-center gap-1">
              <span className="font-semibold">{option.label}</span>
              <span className="text-xs opacity-75">{option.description}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

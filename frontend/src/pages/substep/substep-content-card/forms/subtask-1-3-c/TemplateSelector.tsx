// frontend/src/pages/substep/substep-content-card/forms/subtask-1-3-c/TemplateSelector.tsx
import { TEMPLATE_OPTIONS } from "./types";
import type { Template } from "./types";

interface TemplateSelectorProps {
  value: Template | null;
  onChange: (value: Template) => void;
  isReadOnly?: boolean;
}

export default function TemplateSelector({
  value,
  onChange,
  isReadOnly = false,
}: TemplateSelectorProps) {
  return (
    <div className="space-y-3">
      {TEMPLATE_OPTIONS.map((option) => {
        const isSelected = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => !isReadOnly && onChange(option.value)}
            disabled={isReadOnly}
            className={`
              w-full px-5 py-3 rounded-lg text-sm font-medium transition-all duration-200 border-2 text-left
              ${
                isSelected
                  ? "bg-emerald-50 border-emerald-400 text-emerald-700"
                  : "bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
              }
              ${isReadOnly ? "cursor-default opacity-60" : "cursor-pointer"}
            `}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                  isSelected ? "border-emerald-500" : "border-gray-300"
                }`}
              >
                {isSelected && (
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                )}
              </div>
              <div>
                <div className="font-semibold">{option.label}</div>
                <div className="text-xs opacity-75 mt-0.5">
                  {option.description}
                </div>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

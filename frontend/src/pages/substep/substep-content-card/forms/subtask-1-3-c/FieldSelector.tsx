// frontend/src/pages/substep/substep-content-card/forms/subtask-1-3-c/FieldSelector.tsx

import { REQUIRED_FIELDS } from "./types";
import type { RequiredField } from "./types";

interface FieldSelectorProps {
  selectedFields: RequiredField[];
  onToggle: (field: RequiredField) => void;
  isReadOnly?: boolean;
}

export default function FieldSelector({
  selectedFields,
  onToggle,
  isReadOnly = false,
}: FieldSelectorProps) {
  const handleToggle = (field: RequiredField) => {
    if (isReadOnly) return;
    onToggle(field);
  };

  return (
    <div className="flex flex-wrap gap-2">
      {REQUIRED_FIELDS.map((field) => {
        const isSelected = selectedFields.includes(field.value);
        return (
          <button
            key={field.value}
            type="button"
            onClick={() => handleToggle(field.value)}
            disabled={isReadOnly}
            className={`
              px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border-2
              ${
                isSelected
                  ? "bg-emerald-50 border-emerald-400 text-emerald-700"
                  : "bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
              }
              ${isReadOnly ? "cursor-default opacity-60" : "cursor-pointer"}
            `}
          >
            {field.label}
          </button>
        );
      })}
    </div>
  );
}

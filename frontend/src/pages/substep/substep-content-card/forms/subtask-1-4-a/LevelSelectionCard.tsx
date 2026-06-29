// frontend/src/pages/substep/substep-content-card/forms/subtask-1-4-a/LevelSelectionCard.tsx

import type { ResourceLevel } from "./types";
import {
  LEVEL_COLORS,
  LEVEL_BG_COLORS,
  LEVEL_BORDER_COLORS,
  LEVEL_LABELS,
} from "./types";

interface LevelSelectionCardProps {
  title: string;
  description: string;
  selectedLevel: ResourceLevel | null;
  onSelect: (level: ResourceLevel) => void;
  isReadOnly?: boolean;
}

export default function LevelSelectionCard({
  title,
  description,
  selectedLevel,
  onSelect,
  isReadOnly = false,
}: LevelSelectionCardProps) {
  const levels: ResourceLevel[] = ["low", "medium", "high"];

  const descriptions: Record<ResourceLevel, string> = {
    low: "No direct contact. Access only via proxy (managers, documents).",
    medium: "Available for 1 or 2 phases only.",
    high: "Direct access and regular throughout all project phases.",
  };

  return (
    <div className="space-y-3">
      <div>
        <h4 className="text-sm font-semibold text-gray-900">{title}</h4>
        <p className="text-xs text-gray-600 mt-0.5">{description}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {levels.map((level) => {
          const isSelected = selectedLevel === level;
          const color = LEVEL_COLORS[level];
          const bgColor = LEVEL_BG_COLORS[level];
          const borderColor = LEVEL_BORDER_COLORS[level];

          return (
            <button
              key={level}
              type="button"
              onClick={() => !isReadOnly && onSelect(level)}
              disabled={isReadOnly}
              className={`
                relative p-4 rounded-lg border-2 text-left transition-all duration-200
                ${bgColor}
                ${isSelected ? borderColor : "border-gray-200"}
                ${isReadOnly ? "cursor-default opacity-60" : "cursor-pointer hover:shadow-md"}
                ${isSelected ? "shadow-sm ring-1" : ""}
              `}
              style={{
                borderColor: isSelected ? color : undefined,
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <span className="text-sm font-semibold" style={{ color }}>
                  {LEVEL_LABELS[level]}
                </span>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">
                {descriptions[level]}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

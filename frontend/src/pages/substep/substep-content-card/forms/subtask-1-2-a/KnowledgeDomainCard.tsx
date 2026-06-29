// frontend/src/pages/substep/substep-content-card/forms/subtask-1-2-a/KnowledgeDomainCard.tsx

import { Input } from "@/components/ui/input";
import type { KnowledgeDomain, KnowledgeLevel } from "./types";
import { LEVEL_COLORS, LEVEL_LABELS, LEVEL_DESCRIPTIONS, KNOWLEDGE_LEVELS } from "./types";
import { Check } from "lucide-react";

interface KnowledgeDomainCardProps {
  domain: KnowledgeDomain;
  title: string;
  value: KnowledgeLevel;
  onChange: (level: KnowledgeLevel) => void;
  comment: string;
  onCommentChange: (comment: string) => void;
  isReadOnly?: boolean;
}

export default function KnowledgeDomainCard({
  domain,
  title,
  value,
  onChange,
  comment,
  onCommentChange,
  isReadOnly = false,
}: KnowledgeDomainCardProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5 space-y-4 shadow-sm">
      <h3 className="text-base font-bold text-gray-900">{title}</h3>

      <div className="grid grid-cols-3 gap-3">
        {KNOWLEDGE_LEVELS.map((level) => {
          const isSelected = value === level;
          const color = LEVEL_COLORS[level];

          return (
            <button
              key={level}
              type="button"
              disabled={isReadOnly}
              onClick={() => onChange(level)}
              className={`
                relative flex flex-col items-start p-3 rounded-lg border-2 text-left transition-all duration-200
                ${isReadOnly ? "cursor-default" : "cursor-pointer hover:shadow-md"}
                ${isSelected ? "shadow-sm" : "border-gray-100 hover:border-gray-300"}
              `}
              style={{
                borderColor: isSelected ? color : undefined,
                backgroundColor: isSelected ? `${color}15` : undefined,
              }}
            >
              <div className="flex items-center gap-2 mb-1 w-full">
                <div
                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors`}
                  style={{
                    borderColor: color,
                    backgroundColor: isSelected ? color : "transparent",
                  }}
                >
                  {isSelected && (
                    <Check className="w-3 h-3 text-white" strokeWidth={3} />
                  )}
                </div>
                <span
                  className="text-sm font-bold"
                  style={{ color: isSelected ? color : "#374151" }}
                >
                  {LEVEL_LABELS[level]}
                </span>
              </div>
              <p className="text-xs text-gray-600 leading-tight pl-6">
                {LEVEL_DESCRIPTIONS[domain][level] ||
                  "Description coming soon..."}
              </p>
            </button>
          );
        })}
      </div>

      <Input
        type="text"
        placeholder="Optional comment..."
        value={comment}
        onChange={(e) => onCommentChange(e.target.value)}
        disabled={isReadOnly}
        className="w-full h-9 text-sm bg-gray-50 border-gray-200 focus:bg-white"
      />
    </div>
  );
}

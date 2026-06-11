// frontend/src/pages/substep/substep-content-card/forms/subtask-1-3-c/HeuristicsFormatSummary.tsx
import { FIELD_LABELS } from "./types";
import type { RequiredField, Granularity, Template } from "./types";

interface HeuristicsFormatSummaryProps {
  requiredFields: RequiredField[];
  granularity: Granularity | null;
  template: Template | null;
}

export default function HeuristicsFormatSummary({
  requiredFields,
  granularity,
  template,
}: HeuristicsFormatSummaryProps) {
  const getGranularityText = (g: Granularity) => {
    switch (g) {
      case "short":
        return "Short — 1 sentence";
      case "medium":
        return "Medium — 3-5 sentences";
      case "long":
        return "Long — paragraph";
    }
  };

  const getTemplateText = (t: Template) => {
    switch (t) {
      case "imperative":
        return 'Imperative — "The AI must..."';
      case "conditional":
        return 'Conditional — "The AI should..."';
      case "descriptive":
        return 'Descriptive — "The AI..."';
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
      <div className="flex justify-between items-center py-2 border-b border-gray-100">
        <span className="text-sm text-gray-600">Required fields</span>
        <span className="text-sm font-semibold text-emerald-700">
          {requiredFields.map((f) => FIELD_LABELS[f]).join(", ")}
        </span>
      </div>
      <div className="flex justify-between items-center py-2 border-b border-gray-100">
        <span className="text-sm text-gray-600">Granularity</span>
        <span className="text-sm font-semibold text-emerald-700">
          {granularity ? getGranularityText(granularity) : "Not selected"}
        </span>
      </div>
      <div className="flex justify-between items-center py-2">
        <span className="text-sm text-gray-600">Template</span>
        <span className="text-sm font-semibold text-emerald-700">
          {template ? getTemplateText(template) : "Not selected"}
        </span>
      </div>
    </div>
  );
}

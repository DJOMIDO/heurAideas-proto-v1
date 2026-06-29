// frontend/src/pages/substep/substep-content-card/forms/subtask-1-3-c/LivePreview.tsx

import type { RequiredField, Granularity, Template } from "./types";

interface LivePreviewProps {
  requiredFields: RequiredField[];
  granularity: Granularity | null;
  template: Template | null;
}

export default function LivePreview({
  requiredFields,
  granularity,
  template,
}: LivePreviewProps) {
  const getGranularityText = (g: Granularity) => {
    switch (g) {
      case "short":
        return "1 sentence";
      case "medium":
        return "3-5 sentences";
      case "long":
        return "paragraph";
    }
  };


  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h4 className="text-sm font-semibold text-gray-900">Name</h4>
        <p className="text-sm text-gray-600">Clear Error Messaging</p>
      </div>

      <div className="space-y-4">
        <h4 className="text-sm font-semibold text-gray-900">Description</h4>
        <p className="text-sm text-gray-600 leading-relaxed">
          The AI must provide error messages that are clear, specific, and
          actionable. Users should immediately understand what went wrong and
          how to fix it. Messages should use plain language without technical
          jargon.
        </p>
      </div>

      {requiredFields.includes("example") && (
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-gray-900">Example</h4>
          <p className="text-sm text-gray-600 leading-relaxed">
            The AI must display "Please enter a valid email address (e.g.,
            user@example.com)" when an email format is incorrect. This tells
            users exactly what's wrong and shows the expected format.
          </p>
        </div>
      )}

      {requiredFields.includes("counter-example") && (
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-gray-900">
            Counter-example
          </h4>
          <p className="text-sm text-gray-600 leading-relaxed">
            Showing generic messages like 'Error 402' or 'Invalid input' without
            explaining what field is problematic or how to correct it leaves
            users confused and frustrated.
          </p>
        </div>
      )}

      <div className="pt-4 border-t border-emerald-200 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Fields:</span>
          <span className="font-semibold text-emerald-700">
            {requiredFields.length}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Detail:</span>
          <span className="font-semibold text-emerald-700">
            {granularity ? getGranularityText(granularity) : "Not selected"}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Form:</span>
          <span className="font-semibold text-emerald-700">
            {template ? template : "Not selected"}
          </span>
        </div>
      </div>
    </div>
  );
}

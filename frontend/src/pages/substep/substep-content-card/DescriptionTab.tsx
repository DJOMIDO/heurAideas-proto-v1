// src/pages/substep/substep-content-card/DescriptionTab.tsx

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Clock } from "lucide-react";

interface DescriptionTabProps {
  stepTitle: string;
  description?: string;
  lastSaved?: string | null;
  isSaving?: boolean;
}

export default function DescriptionTab({
  stepTitle,
  description,
  lastSaved,
  isSaving = false,
}: DescriptionTabProps) {
  return (
    <Card className="flex-1 m-4 border border-gray-200 shadow-sm">
      <CardHeader className="px-6 pb-2">
        <CardTitle className="text-base font-semibold text-gray-900">
          {stepTitle}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-6">
        <div className="min-h-[200px] max-h-[600px] overflow-y-auto">
          <p className="text-sm text-gray-600 whitespace-pre-wrap">
            {description || "No description available."}
          </p>
          {lastSaved && (
            <div className="flex items-center gap-2 text-xs text-gray-500 mt-4">
              {isSaving ? (
                <>
                  <Clock className="w-3 h-3 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3 h-3 text-green-600" />
                  <span>
                    Last saved: {new Date(lastSaved).toLocaleTimeString()}
                  </span>
                </>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

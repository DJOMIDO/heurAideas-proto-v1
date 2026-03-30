// src/pages/substep/substep-content-card/DescriptionTab.tsx

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface DescriptionTabProps {
  stepTitle: string;
  description?: string;
}

export default function DescriptionTab({
  stepTitle,
  description,
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
        </div>
      </CardContent>
    </Card>
  );
}

// src/pages/substep/substep-content-card/SubtaskHeader.tsx

import { CardHeader, CardTitle } from "@/components/ui/card";

interface SubtaskHeaderProps {
  subtaskId: string;
  title: string;
}

export default function SubtaskHeader({
  subtaskId,
  title,
}: SubtaskHeaderProps) {
  return (
    <CardHeader className="px-6 pb-2 border-b border-gray-100">
      <CardTitle className="text-base font-semibold text-gray-900">
        {subtaskId.toUpperCase()}. {title}
      </CardTitle>
    </CardHeader>
  );
}

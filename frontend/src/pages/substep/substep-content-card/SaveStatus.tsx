// src/pages/substep/substep-content-card/SaveStatus.tsx

import { CheckCircle2, Clock } from "lucide-react";

interface SaveStatusProps {
  lastSaved?: string | null;
  isSaving?: boolean;
}

export default function SaveStatus({
  lastSaved,
  isSaving = false,
}: SaveStatusProps) {
  if (!lastSaved) return null;

  return (
    <div className="flex items-center gap-2 text-xs text-gray-500 pt-4 border-t border-gray-100">
      {isSaving ? (
        <>
          <Clock className="w-3 h-3 animate-spin" />
          <span>Saving...</span>
        </>
      ) : (
        <>
          <CheckCircle2 className="w-3 h-3 text-green-600" />
          <span>Last saved: {new Date(lastSaved).toLocaleTimeString()}</span>
        </>
      )}
    </div>
  );
}

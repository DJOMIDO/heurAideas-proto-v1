// frontend/src/components/ConflictWarning.tsx

import { AlertTriangle } from "lucide-react";

interface ConflictWarningProps {
  fieldName: string;
  editingUser: string;
  onResolve: () => void;
}

export default function ConflictWarning({
  fieldName,
  editingUser,
  onResolve,
}: ConflictWarningProps) {
  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 shadow-lg">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-900">
              {editingUser} is editing "{fieldName}"
            </p>
            <p className="text-xs text-amber-700 mt-1">
              Your changes may be overwritten. Keep your changes or discard?
            </p>
            <div className="flex gap-2 mt-3">
              <button
                onClick={onResolve}
                className="px-3 py-1 text-xs font-medium text-white bg-amber-600 rounded hover:bg-amber-700 transition-colors"
              >
                Keep mine
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-3 py-1 text-xs font-medium text-amber-700 bg-amber-100 rounded hover:bg-amber-200 transition-colors"
              >
                Load theirs
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// frontend/src/components/TypingIndicator.tsx

import { AlertCircle } from "lucide-react";

interface EditingUser {
  userId: number;
  username: string;
  timestamp: string;
}

interface TypingIndicatorProps {
  editingUsers?: Record<string, EditingUser>;
  fieldName: string;
}

export default function TypingIndicator({
  editingUsers = {},
  fieldName,
}: TypingIndicatorProps) {
  const editingUser = editingUsers[fieldName];

  if (!editingUser) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded mt-1">
      <AlertCircle className="w-3 h-3" />
      <span>{editingUser.username} is editing...</span>
    </div>
  );
}

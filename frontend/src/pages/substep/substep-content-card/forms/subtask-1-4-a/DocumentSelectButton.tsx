// frontend/src/pages/substep/substep-content-card/forms/subtask-1-4-a/DocumentSelectButton.tsx
import { Plus } from "lucide-react";

interface DocumentSelectButtonProps {
  onClick: () => void;
  isReadOnly?: boolean;
}

export default function DocumentSelectButton({
  onClick,
  isReadOnly = false,
}: DocumentSelectButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isReadOnly}
      className={`
        w-full py-4 border-2 border-dashed border-gray-300 rounded-lg
        flex items-center justify-center gap-2
        text-sm font-medium text-gray-600
        hover:border-gray-400 hover:bg-gray-50
        transition-all duration-200
        ${isReadOnly ? "opacity-60 cursor-default" : "cursor-pointer"}
      `}
    >
      <Plus className="w-5 h-5" />
      Select Documents from Library
    </button>
  );
}

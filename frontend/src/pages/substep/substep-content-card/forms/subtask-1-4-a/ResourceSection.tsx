// frontend/src/pages/substep/substep-content-card/forms/subtask-1-4-a/ResourceSection.tsx

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface ResourceSectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

export default function ResourceSection({
  title,
  icon,
  children,
  defaultOpen = true,
}: ResourceSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-3">
          {icon}
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
            {title}
          </h3>
        </div>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-gray-500" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-500" />
        )}
      </button>

      {isOpen && <div className="p-6 space-y-6">{children}</div>}
    </div>
  );
}

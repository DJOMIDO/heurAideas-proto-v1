// frontend/src/components/CollapsibleCard.tsx

import { useState, type ReactNode } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CollapsibleCardProps {
  title: string;
  children: ReactNode;
  defaultExpanded?: boolean;
  onToggle?: (expanded: boolean) => void;
}

export default function CollapsibleCard({
  title,
  children,
  defaultExpanded = true,
  onToggle,
}: CollapsibleCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const handleToggle = () => {
    const newState = !isExpanded;
    setIsExpanded(newState);
    onToggle?.(newState);
  };

  return (
    <div className="flex flex-col border border-gray-200 rounded-lg bg-white shadow-sm overflow-hidden">
      <div className="flex items-center justify-between p-3 bg-gray-50 border-b border-gray-100">
        <h3 className="font-semibold text-sm text-gray-800 truncate pr-2">
          {title}
        </h3>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-gray-500 hover:text-gray-700"
          onClick={handleToggle}
        >
          {isExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>
      </div>

      {isExpanded && <div className="p-4 flex-1 overflow-auto">{children}</div>}
    </div>
  );
}

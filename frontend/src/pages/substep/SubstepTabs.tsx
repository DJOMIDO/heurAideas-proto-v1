// src/pages/substep/SubstepTabs.tsx

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Columns2, X } from "lucide-react";
import { type Substep } from "@/data/steps";

interface SubstepTabsProps {
  substep: Substep;
  value: string;
  onValueChange: (value: string) => void;
  isSplitView?: boolean;
  onToggleSplitView?: () => void;
  onTabDragStart?: (e: React.DragEvent, tabId: string) => void;
}

export default function SubstepTabs({
  substep,
  value,
  onValueChange,
  isSplitView = false,
  onToggleSplitView,
  onTabDragStart,
}: SubstepTabsProps) {
  const tabs = [
    { id: "description", label: "Description" },
    ...(substep.subtasks || []).map((subtask) => ({
      id: `subtask-${subtask.id}`,
      label: `${subtask.id.toUpperCase()}. ${subtask.title}`,
    })),
  ];

  return (
    <Tabs
      value={value}
      onValueChange={onValueChange}
      className="w-full border-b border-gray-200 bg-white"
    >
      {/* 移除 flex items-center，保持左对齐 */}
      <TabsList className="h-12 bg-transparent border-0 px-4 gap-1">
        {tabs.map((tab) => (
          <TabsTrigger
            key={tab.id}
            value={tab.id}
            draggable={true}
            onDragStart={(e) => onTabDragStart?.(e, tab.id)}
            onDragEnd={(e) => {
              (e.target as HTMLElement).style.opacity = "1";
            }}
            className={`
              data-[state=active]:bg-transparent 
              data-[state=active]:text-blue-600 
              data-[state=active]:border-b-2 
              data-[state=active]:border-blue-600 
              rounded-none px-4 
              cursor-grab active:cursor-grabbing
              transition-opacity duration-150
              hover:opacity-90
            `}
            onDrag={(e) => {
              (e.target as HTMLElement).style.opacity = "0.6";
            }}
          >
            {tab.label}
          </TabsTrigger>
        ))}

        {/* 分屏按钮：使用 ml-auto 推到最右侧 */}
        {onToggleSplitView && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleSplitView}
            className={`
              ml-auto h-8 w-8 
              text-gray-500 hover:text-blue-600
              hover:bg-blue-50
              transition-colors duration-150
              ${isSplitView ? "bg-blue-50 text-blue-600" : ""}
            `}
            title={isSplitView ? "Exit split view" : "Enable split view"}
            aria-label={isSplitView ? "Exit split view" : "Enable split view"}
          >
            {isSplitView ? (
              <X className="h-4 w-4" />
            ) : (
              <Columns2 className="h-4 w-4" />
            )}
          </Button>
        )}
      </TabsList>
    </Tabs>
  );
}

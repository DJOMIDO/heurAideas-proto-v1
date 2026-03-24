// src/pages/substep-comments/CommentFilters.tsx

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CommentFiltersProps {
  filter: "all" | "resolved" | "unresolved";
  onFilterChange: (value: "all" | "resolved" | "unresolved") => void;
  subtaskFilter: string;
  onSubtaskFilterChange: (value: string) => void;
  subtasks: { id: string; code: string; title: string }[];
}

export default function CommentFilters({
  filter,
  onFilterChange,
  subtaskFilter,
  onSubtaskFilterChange,
  subtasks,
}: CommentFiltersProps) {
  return (
    <div className="bg-white border-b px-6 py-3">
      <div className="flex items-center justify-between gap-4">
        <Tabs value={filter} onValueChange={(v) => onFilterChange(v as any)}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="unresolved">Unresolved</TabsTrigger>
            <TabsTrigger value="resolved">Resolved</TabsTrigger>
          </TabsList>
        </Tabs>

        {subtasks && subtasks.length > 0 && (
          <Select value={subtaskFilter} onValueChange={onSubtaskFilterChange}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by subtask" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Subtasks</SelectItem>
              {subtasks.map((task) => (
                <SelectItem key={task.id} value={task.id}>
                  {task.code} - {task.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
    </div>
  );
}

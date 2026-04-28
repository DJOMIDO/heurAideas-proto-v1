// frontend/src/pages/substep/substep-content-card/forms/subtask-2-1-a/TaskHeader.tsx

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChevronUp, ChevronDown } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { TaskData } from "./types";

interface TaskHeaderProps {
  task: TaskData;
  updateTask: (updates: Partial<TaskData>) => void;
}

export default function TaskHeader({ task, updateTask }: TaskHeaderProps) {
  return (
    <div className="flex items-center gap-3 p-3 bg-purple-50 border-b border-purple-100">
      <div className="flex items-center gap-2 shrink-0">
        <Select
          value={task.state}
          onValueChange={(v) => updateTask({ state: v })}
        >
          <SelectTrigger className="w-[100px] bg-white border-purple-200 h-8 text-xs">
            <SelectValue placeholder="State" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="State">State</SelectItem>
            <SelectItem value="None">None</SelectItem>
          </SelectContent>
        </Select>

        <span className="font-mono font-bold text-purple-900 text-sm">
          {task.id}
        </span>
      </div>

      <Input
        placeholder="Enter the name of the task"
        value={task.name}
        onChange={(e) => updateTask({ name: e.target.value })}
        className="flex-1 bg-white border-purple-200 h-8 text-sm"
      />

      <Button
        variant="ghost"
        size="sm"
        onClick={() => updateTask({ isExpanded: !task.isExpanded })}
        className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700"
      >
        {task.isExpanded ? (
          <ChevronUp className="w-4 h-4" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        )}
      </Button>
    </div>
  );
}

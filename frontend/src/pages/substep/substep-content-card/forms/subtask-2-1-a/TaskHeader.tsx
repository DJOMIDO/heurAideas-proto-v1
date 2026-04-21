// frontend/src/pages/substep/substep-content-card/forms/subtask-2-1-a/TaskHeader.tsx

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChevronUp, ChevronDown } from "lucide-react";
import type { TaskData } from "./types";

interface TaskHeaderProps {
  task: TaskData;
  updateTask: (updates: Partial<TaskData>) => void;
}

export default function TaskHeader({ task, updateTask }: TaskHeaderProps) {
  return (
    <div className="bg-purple-100 p-4 flex items-center gap-3">
      <Select
        value={task.state}
        onValueChange={(v) => updateTask({ state: v })}
      >
        <SelectTrigger className="w-[120px] bg-white border-purple-200">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="State">State</SelectItem>
          <SelectItem value="...">...</SelectItem>
        </SelectContent>
      </Select>

      <span className="font-mono font-bold text-purple-900">{task.id}</span>

      <Input
        placeholder="Enter the name of the task"
        value={task.name}
        onChange={(e) => updateTask({ name: e.target.value })}
        className="flex-1 bg-white border-purple-200"
      />

      <Button
        variant="ghost"
        size="sm"
        onClick={() => updateTask({ isExpanded: !task.isExpanded })}
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

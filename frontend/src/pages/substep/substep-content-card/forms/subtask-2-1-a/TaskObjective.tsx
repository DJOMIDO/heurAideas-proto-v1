// frontend/src/pages/substep/substep-content-card/forms/subtask-2-1-a/TaskObjective.tsx

import { Textarea } from "@/components/ui/textarea";
import type { TaskData } from "./types";

interface TaskObjectiveProps {
  task: TaskData;
  updateTask: (updates: Partial<TaskData>) => void;
}

export default function TaskObjective({
  task,
  updateTask,
}: TaskObjectiveProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-gray-800">
        Task objective:
      </label>
      <Textarea
        placeholder="Enter the objective of the task"
        value={task.objective}
        onChange={(e) => updateTask({ objective: e.target.value })}
        className="min-h-[100px]"
      />
    </div>
  );
}

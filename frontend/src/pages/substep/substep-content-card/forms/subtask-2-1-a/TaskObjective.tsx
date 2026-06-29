// frontend/src/pages/substep/substep-content-card/forms/subtask-2-1-a/TaskObjective.tsx

import { Textarea } from "@/components/ui/textarea";
import type { TaskData } from "./types";
import TypingIndicator from "@/components/TypingIndicator";

interface TaskObjectiveProps {
  task: TaskData;
  updateTask: (updates: Partial<TaskData>) => void;
  fieldPrefix: string;
  onFormDataChange?: (field: string, value: any) => void;
  editingUsers?: Record<
    string,
    { userId: number; username: string; timestamp: string }
  >;
}

export default function TaskObjective({
  task,
  updateTask,
  fieldPrefix,
  onFormDataChange,
  editingUsers,
}: TaskObjectiveProps) {
  const fieldNameKey = `${fieldPrefix}-${task.id}-objective`;
  return (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-gray-800">
        Task objective:
      </label>
      <Textarea
        placeholder="Enter the objective of the task"
        value={task.objective}
        onChange={(e) => {
          if (onFormDataChange) {
            onFormDataChange(fieldNameKey, e.target.value);
          }
          updateTask({ objective: e.target.value });
        }}
        className="min-h-[80px] bg-white"
      />
      <TypingIndicator editingUsers={editingUsers} fieldName={fieldNameKey} />
    </div>
  );
}

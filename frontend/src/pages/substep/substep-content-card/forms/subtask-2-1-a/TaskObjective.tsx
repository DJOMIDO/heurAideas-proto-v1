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
          // 动作 1：触发打字通知
          if (onFormDataChange) {
            onFormDataChange(fieldNameKey, e.target.value);
          }
          // 动作 2：更新本地数据
          updateTask({ objective: e.target.value });
        }}
        className="min-h-[80px] bg-white"
      />
      {/* 动作 3：显示输入提示 */}
      <TypingIndicator editingUsers={editingUsers} fieldName={fieldNameKey} />
    </div>
  );
}

// frontend/src/pages/substep/substep-content-card/forms/subtask-2-1-a/TaskSection.tsx

import { Card, CardContent } from "@/components/ui/card";
import type { TaskData } from "./types";
import TaskHeader from "./TaskHeader";
import TaskObjective from "./TaskObjective";
import TaskQualityCriteria from "./TaskQualityCriteria";
import TaskStakeholders from "./TaskStakeholders";
import TaskConstraints from "./TaskConstraints";
import SubtaskList from "./SubtaskList";

interface TaskSectionProps {
  fieldPrefix: string;
  task: TaskData;
  updateTask: (updates: Partial<TaskData>) => void;
  formData: Record<string, any>;
  onFormDataChange: (field: string, value: any) => void;
  editingUsers?: Record<
    string,
    { userId: number; username: string; timestamp: string }
  >;
  conflictFields?: Record<string, { username: string; timestamp: string }>;
  currentUserId?: number;
  onConflictResolve?: (field: string) => void;
}

export default function TaskSection({
  fieldPrefix,
  task,
  updateTask,
  formData,
  onFormDataChange,
  editingUsers,
  conflictFields,
  currentUserId,
  onConflictResolve,
}: TaskSectionProps) {
  return (
    <Card className="border-2 border-gray-200 rounded-xl overflow-hidden">
      <TaskHeader task={task} updateTask={updateTask} />

      {task.isExpanded && (
        <CardContent className="p-6 space-y-6">
          <TaskObjective task={task} updateTask={updateTask} />
          <TaskQualityCriteria task={task} updateTask={updateTask} />
          <TaskStakeholders
            fieldPrefix={fieldPrefix}
            formData={formData}
            onFormDataChange={onFormDataChange}
            editingUsers={editingUsers}
            conflictFields={conflictFields}
            currentUserId={currentUserId}
            onConflictResolve={onConflictResolve}
          />
          <TaskConstraints task={task} updateTask={updateTask} />
          <SubtaskList
            task={task}
            updateTask={updateTask}
            fieldPrefix={fieldPrefix}
            formData={formData}
          />
        </CardContent>
      )}
    </Card>
  );
}

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
  // 仅透传给 StakeholderSection，其他子组件不依赖
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
      <TaskHeader
        task={task}
        updateTask={updateTask}
        fieldPrefix={fieldPrefix}
        onFormDataChange={onFormDataChange}
        editingUsers={editingUsers}
      />

      {task.isExpanded && (
        <CardContent className="p-6 space-y-6">
          <TaskObjective
            task={task}
            updateTask={updateTask}
            fieldPrefix={fieldPrefix}
            onFormDataChange={onFormDataChange}
            editingUsers={editingUsers}
          />
          <TaskQualityCriteria
            task={task}
            updateTask={updateTask}
            fieldPrefix={fieldPrefix}
            onFormDataChange={onFormDataChange}
            editingUsers={editingUsers}
          />

          {/* Stakeholder 走独立数据流，复用 1.1.A 组件 */}
          <TaskStakeholders
            fieldPrefix={fieldPrefix}
            formData={formData}
            onFormDataChange={onFormDataChange}
            editingUsers={editingUsers}
            conflictFields={conflictFields}
            currentUserId={currentUserId}
            onConflictResolve={onConflictResolve}
          />

          <TaskConstraints
            task={task}
            updateTask={updateTask}
            fieldPrefix={fieldPrefix}
            onFormDataChange={onFormDataChange}
            editingUsers={editingUsers}
          />
          <SubtaskList
            task={task}
            updateTask={updateTask}
            fieldPrefix={fieldPrefix}
            formData={formData}
            onFormDataChange={onFormDataChange}
            editingUsers={editingUsers}
          />
        </CardContent>
      )}
    </Card>
  );
}

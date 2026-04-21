// frontend/src/pages/substep/substep-content-card/forms/Subtask2_1_A.tsx

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import TypingIndicator from "@/components/TypingIndicator";
import TaskSection from "./subtask-2-1-a/TaskSection";
import type { TaskData } from "./subtask-2-1-a/types";

export default function Subtask2_1_A({
  fieldPrefix,
  formData,
  onFormDataChange,
  editingUsers = {},
  conflictFields,
  currentUserId,
  onConflictResolve,
}: {
  fieldPrefix: string;
  formData: Record<string, any>;
  onFormDataChange: (field: string, value: any) => void;
  editingUsers?: Record<
    string,
    { userId: number; username: string; timestamp: string }
  >;
  conflictFields?: Record<string, { username: string; timestamp: string }>;
  currentUserId?: number;
  onConflictResolve?: (field: string) => void;
  onRemove?: () => void;
}) {
  const [tasks, setTasks] = useState<TaskData[]>([]);

  const generateNextTaskId = (): string => {
    const nextNum = tasks.length + 1;
    return `T${String(nextNum).padStart(3, "0")}`;
  };

  const createNewTask = (): TaskData => ({
    id: generateNextTaskId(),
    name: "",
    state: "State",
    objective: "",
    qualityCriteria: [
      { id: `qc-${Date.now()}-1`, value: "" },
      { id: `qc-${Date.now()}-2`, value: "" },
      { id: `qc-${Date.now()}-3`, value: "" },
    ],
    constraints: [
      {
        id: `c-${Date.now()}-1`,
        type: "Physical",
        value: "",
        observables: [{ id: `oe-${Date.now()}-1`, value: "" }],
      },
    ],
    subtasks: [],
    isExpanded: true,
  });

  const handleAddTask = () => {
    setTasks((prev) => [...prev, createNewTask()]);
  };

  const updateTask = (taskId: string, updates: Partial<TaskData>) => {
    setTasks((prev) =>
      prev.map((task) => (task.id === taskId ? { ...task, ...updates } : task)),
    );
  };

  return (
    <div className="space-y-6">
      <p className="text-base text-gray-700 leading-relaxed">
        Enter the description of the activity of interest by describing its
        tasks and sub-tasks.
      </p>

      <Button
        onClick={handleAddTask}
        className="bg-white hover:bg-teal-50 text-teal-600 hover:text-teal-700 font-medium px-6 py-5 rounded-lg shadow-sm transition-all duration-200 flex items-center gap-3"
      >
        <Plus className="w-5 h-5" />
        <span className="text-base">Add new task</span>
      </Button>

      <div className="space-y-6">
        {tasks.map((task) => (
          <TaskSection
            key={task.id}
            fieldPrefix={`${fieldPrefix}-${task.id}`}
            task={task}
            updateTask={(updates) => updateTask(task.id, updates)}
            formData={formData}
            onFormDataChange={onFormDataChange}
            editingUsers={editingUsers}
            conflictFields={conflictFields}
            currentUserId={currentUserId}
            onConflictResolve={onConflictResolve}
          />
        ))}
      </div>

      {tasks.length === 0 && (
        <div className="text-center py-8 text-gray-400 text-sm">
          No tasks added yet. Click "Add new task" to get started.
        </div>
      )}

      <TypingIndicator
        editingUsers={editingUsers}
        fieldName={`${fieldPrefix}-tasks-list`}
      />
    </div>
  );
}

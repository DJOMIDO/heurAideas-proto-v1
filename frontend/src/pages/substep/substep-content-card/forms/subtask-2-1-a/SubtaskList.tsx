// frontend/src/pages/substep/substep-content-card/forms/subtask-2-1-a/SubtaskList.tsx

import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import SubtaskItem from "./SubtaskItem";
import type { SubtaskData, TaskData, Stakeholder } from "./types";

interface SubtaskListProps {
  task: TaskData;
  updateTask: (updates: Partial<TaskData>) => void;
  fieldPrefix: string;
  formData: Record<string, any>;
  onFormDataChange?: (field: string, value: any) => void;
  editingUsers?: Record<
    string,
    { userId: number; username: string; timestamp: string }
  >;
}

export default function SubtaskList({
  task,
  updateTask,
  fieldPrefix,
  formData,
  onFormDataChange,
  editingUsers,
}: SubtaskListProps) {
  const subtasks = task.subtasks || [];

  const stakeholdersPrefix = `${fieldPrefix}-task-stakeholders`;
  const availableStakeholders: Stakeholder[] = useMemo(() => {
    const stakeholders: Stakeholder[] = [];
    const colors = [
      "bg-purple-500",
      "bg-blue-500",
      "bg-green-500",
      "bg-yellow-500",
      "bg-red-500",
    ];
    let idx = 0;
    while (true) {
      const name = formData[`${stakeholdersPrefix}-stakeholder-role-${idx}`];
      if (!name) break;
      const role =
        formData[`${stakeholdersPrefix}-stakeholder-role-${idx}-role`] || "";
      stakeholders.push({
        id: `stakeholder-${idx}`,
        name,
        role,
        color: colors[idx % colors.length],
      });
      idx++;
    }
    return stakeholders;
  }, [formData, stakeholdersPrefix]);

  const addSubtask = () => {
    const newSubtask: SubtaskData = {
      id: `${task.id}.${subtasks.length + 1}`,
      name: "",
      state: "State",
      isExpanded: true,
      selectedCriteria: [],
      selectedStakeholders: [],
      selectedConstraints: [],
    };
    updateTask({ subtasks: [...subtasks, newSubtask] });
  };

  const handleUpdateSubtask = (updatedSubtask: SubtaskData) => {
    updateTask({
      subtasks: subtasks.map((st) =>
        st.id === updatedSubtask.id ? updatedSubtask : st,
      ),
    });
  };

  const handleToggleSubtaskExpand = (subtaskId: string) => {
    updateTask({
      subtasks: subtasks.map((st) =>
        st.id === subtaskId ? { ...st, isExpanded: !st.isExpanded } : st,
      ),
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
        <span className="text-sm font-semibold text-gray-700">
          Subtasks ({subtasks.length})
        </span>
      </div>

      <div className="space-y-4 pl-4 border-l-2 border-blue-100 ml-2">
        {subtasks.map((subtask) => (
          <SubtaskItem
            key={subtask.id}
            subtask={subtask}
            parentTask={task}
            availableStakeholders={availableStakeholders}
            onUpdateSubtask={handleUpdateSubtask}
            onToggleExpand={() => handleToggleSubtaskExpand(subtask.id)}
            fieldPrefix={fieldPrefix}
            onFormDataChange={onFormDataChange}
            editingUsers={editingUsers}
          />
        ))}

        <Button
          variant="outline"
          size="sm"
          onClick={addSubtask}
          className="w-full mt-2 h-9 text-xs border-dashed border-gray-300 hover:border-teal-500 hover:text-teal-600 hover:bg-teal-50/50 transition-all"
        >
          <Plus className="w-3.5 h-3.5 mr-1.5" /> Add subtask
        </Button>
      </div>
    </div>
  );
}

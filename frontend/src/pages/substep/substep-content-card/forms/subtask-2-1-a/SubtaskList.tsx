// frontend/src/pages/substep/substep-content-card/forms/subtask-2-1-a/SubtaskList.tsx

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Plus, ChevronUp } from "lucide-react";
import SubtaskItem from "./SubtaskItem";
import type { SubtaskData, TaskData, Stakeholder } from "./types";

interface SubtaskListProps {
  task: TaskData;
  updateTask: (updates: Partial<TaskData>) => void;
  fieldPrefix: string;
  formData: Record<string, any>;
}

export default function SubtaskList({
  task,
  updateTask,
  fieldPrefix,
  formData,
}: SubtaskListProps) {
  const [isSubtasksExpanded, setIsSubtasksExpanded] = useState(true);

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
    setIsSubtasksExpanded(true);
    const newSubtask: SubtaskData = {
      id: `${task.id}.${task.subtasks.length + 1}`,
      name: "",
      state: "State",
      isExpanded: true,
      selectedCriteria: [],
      selectedStakeholders: [],
      selectedConstraints: [],
    };
    updateTask({ subtasks: [...task.subtasks, newSubtask] });
  };

  const handleUpdateSubtask = (updatedSubtask: SubtaskData) => {
    updateTask({
      subtasks: task.subtasks.map((st) =>
        st.id === updatedSubtask.id ? updatedSubtask : st,
      ),
    });
  };

  const handleToggleExpand = (subtaskId: string) => {
    updateTask({
      subtasks: task.subtasks.map((st) =>
        st.id === subtaskId ? { ...st, isExpanded: !st.isExpanded } : st,
      ),
    });
  };

  return (
    <div className="pt-4 border-t border-gray-200 space-y-4">
      <button
        onClick={() => setIsSubtasksExpanded(!isSubtasksExpanded)}
        className="w-full flex items-center justify-between bg-gray-50 p-3 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wide">
          Subtasks
        </h3>
        <ChevronUp
          className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${
            isSubtasksExpanded ? "" : "-rotate-180"
          }`}
        />
      </button>

      {isSubtasksExpanded && (
        <>
          <div className="space-y-4">
            {task.subtasks.map((subtask) => (
              <SubtaskItem
                key={subtask.id}
                subtask={subtask}
                parentTask={task}
                availableStakeholders={availableStakeholders}
                onUpdateSubtask={handleUpdateSubtask}
                onToggleExpand={() => handleToggleExpand(subtask.id)}
              />
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={addSubtask}
            className="w-auto"
          >
            <Plus className="w-4 h-4 mr-2" /> Add subtasks
          </Button>
        </>
      )}
    </div>
  );
}

// frontend/src/pages/substep/substep-content-card/forms/Subtask2_1_A.tsx

import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import TypingIndicator from "@/components/TypingIndicator";
import TaskSection from "./subtask-2-1-a/TaskSection";
import { useSubtask2_1ASync } from "./subtask-2-1-a/useSubtask2_1ASync";
import type { TaskData } from "./subtask-2-1-a/types";

interface Subtask2_1_AProps {
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
  projectId?: number;
  sendMessage?: (message: any) => void;
  userInfo?: { name: string } | null;
  syncKey?: number;
}

export default function Subtask2_1_A({
  fieldPrefix,
  formData,
  onFormDataChange,
  editingUsers = {},
  conflictFields,
  currentUserId,
  onConflictResolve,
  projectId: propProjectId,
  sendMessage,
  userInfo,
  syncKey = 0,
}: Subtask2_1_AProps) {
  const projectId = propProjectId ?? 123;
  const substepId = "2.1";

  // 接入数据同步 Hook
  const { tasks, isSaving, lastSavedAt, updateTask, addTask } =
    useSubtask2_1ASync({
      projectId,
      substepId,
      userId: currentUserId || 0,
      initialTasks: [],
      sendMessage,
      userInfo: userInfo ?? undefined,
      syncKey,
    });

  // 创建新任务的模板生成函数
  const createNewTask = useCallback(
    (): TaskData => ({
      id: `T${String(tasks.length + 1).padStart(3, "0")}`,
      name: "",
      state: "State",
      objective: "",
      qualityCriteria: [
        { id: `qc-${Date.now()}-1`, value: "" },
        { id: `qc-${Date.now()}-2`, value: "" },
        { id: `qc-${Date.now()}-3`, value: "" },
        { id: `qc-${Date.now()}-4`, value: "" },
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
    }),
    [tasks.length],
  );

  // 添加新任务
  const handleAddTask = useCallback(() => {
    addTask(createNewTask());
  }, [addTask, createNewTask]);

  return (
    <div className="space-y-6">
      <p className="text-base text-gray-700 leading-relaxed">
        Enter the description of the activity of interest by describing its
        tasks and sub-tasks.
      </p>

      {/* 添加任务按钮 */}
      <Button
        onClick={handleAddTask}
        className="bg-white hover:bg-teal-50 text-teal-600 hover:text-teal-700 font-medium px-6 py-5 rounded-lg shadow-sm transition-all duration-200 flex items-center gap-3"
        disabled={isSaving}
      >
        <Plus className="w-5 h-5" />
        <span className="text-base">Add new task</span>
      </Button>

      {/* 任务列表渲染 */}
      <div className="space-y-6">
        {tasks.map((task) => (
          <TaskSection
            key={task.id}
            // 确保每个 Task 的 Stakeholder 拥有独立的 fieldPrefix
            // 这样 1.1.A 的 StakeholderSection 才能正确隔离数据
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

      {/* 空状态提示 */}
      {tasks.length === 0 && (
        <div className="text-center py-8 text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-lg">
          No tasks added yet. Click "Add new task" to get started.
        </div>
      )}

      {/* 保存状态指示器 */}
      {lastSavedAt && (
        <div className="text-xs text-gray-400 text-right mt-2">
          Last saved: {new Date(lastSavedAt).toLocaleTimeString()}
          {isSaving && " • Saving..."}
        </div>
      )}

      {/* 打字指示器（用于非 2.1.A 字段，保持兼容） */}
      <TypingIndicator
        editingUsers={editingUsers}
        fieldName={`${fieldPrefix}-tasks-list`}
      />
    </div>
  );
}

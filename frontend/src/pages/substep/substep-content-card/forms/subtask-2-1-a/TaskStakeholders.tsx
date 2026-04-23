// frontend/src/pages/substep/substep-content-card/forms/subtask-2-1-a/TaskStakeholders.tsx

import StakeholderSection from "@/pages/substep/substep-content-card/forms/subtask-1-1-a/StakeholderSection";

interface TaskStakeholdersProps {
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
}

export default function TaskStakeholders({
  fieldPrefix,
  formData,
  onFormDataChange,
  editingUsers,
  conflictFields,
  currentUserId,
  onConflictResolve,
}: TaskStakeholdersProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-gray-800">
        Task stakeholders:
      </label>

      {/* 
        🔑 关键隔离逻辑：
        fieldPrefix 在父组件中已拼接为 `${globalPrefix}-${taskId}`
        最终键名示例: "2.1-T001-task-stakeholders-stakeholder-role-0"
        确保每个 Task 的干系人数据完全独立，但角色推荐仍走项目级全局接口
      */}
      <StakeholderSection
        formData={formData}
        onFormDataChange={onFormDataChange}
        fieldPrefix={`${fieldPrefix}-task-stakeholders`}
        editingUsers={editingUsers}
        conflictFields={conflictFields}
        currentUserId={currentUserId}
        onConflictResolve={onConflictResolve}
      />
    </div>
  );
}

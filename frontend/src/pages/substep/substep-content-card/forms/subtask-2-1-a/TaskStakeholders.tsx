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

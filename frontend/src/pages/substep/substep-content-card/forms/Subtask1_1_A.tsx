// frontend/src/pages/substep/substep-content-card/forms/Subtask1_1_A.tsx

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import PrimaryElementsTable from "./subtask-1-1-a/PrimaryElementsTable";
import StakeholderSection from "./subtask-1-1-a/StakeholderSection";
import TypingIndicator from "@/components/TypingIndicator";

interface Subtask1_1_AProps {
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

export default function Subtask1_1_A({
  fieldPrefix,
  formData,
  onFormDataChange,
  editingUsers = {},
  conflictFields = {},
  currentUserId,
  onConflictResolve,
}: Subtask1_1_AProps) {
  const getField = (field: string) => formData[`${fieldPrefix}-${field}`] || "";
  const updateField = (field: string, value: any) => {
    onFormDataChange(`${fieldPrefix}-${field}`, value);
  };

  return (
    <>
      {/* 1. Register the activity of interest */}
      <div className="space-y-2">
        <label className="text-sm font-semibold text-gray-800">
          1. Register the activity of interest*
        </label>
        <p className="text-xs text-gray-500 italic">
          *The name given for the activity will be automatically reused for the
          rest of the activity. You can come back here to change it.
        </p>
        <Input
          placeholder="Enter the name of the activity"
          value={getField("activityName")}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            updateField("activityName", e.target.value)
          }
          className="max-w-2xl"
        />
        <TypingIndicator
          editingUsers={editingUsers}
          fieldName={`${fieldPrefix}-activityName`}
        />
      </div>

      {/* 2. Propose a short definition */}
      <div className="space-y-2">
        <label className="text-sm font-semibold text-gray-800">
          2. Propose a short definition of this activity
        </label>
        <Textarea
          placeholder="Enter the description of the activity"
          value={getField("activityDefinition")}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
            updateField("activityDefinition", e.target.value)
          }
          className="max-w-2xl min-h-[80px]"
        />
        <TypingIndicator
          editingUsers={editingUsers}
          fieldName={`${fieldPrefix}-activityDefinition`}
        />
      </div>

      {/* 3. Primary Elements Table */}
      <PrimaryElementsTable
        formData={formData}
        onFormDataChange={onFormDataChange}
        fieldPrefix={fieldPrefix}
        editingUsers={editingUsers}
        conflictFields={conflictFields}
        currentUserId={currentUserId}
        onConflictResolve={onConflictResolve}
      />

      {/* 4. Stakeholder Section */}
      <div className="space-y-2">
        <div>
          <h3 className="text-sm font-semibold text-gray-800">
            4. Identify the stakeholders involved in the activity and that might
            be concerned by the SoI use *
          </h3>
        </div>

        <StakeholderSection
          formData={formData}
          onFormDataChange={onFormDataChange}
          fieldPrefix={fieldPrefix}
          editingUsers={editingUsers}
          conflictFields={conflictFields}
          currentUserId={currentUserId}
          onConflictResolve={onConflictResolve}
        />
      </div>

      {/* 5. Additional Stakeholders */}
      <div className="space-y-2">
        <label className="text-sm font-semibold text-gray-800">
          5. Identify the stakeholders involved in the activity and that might
          be concerned by the SoI use
        </label>
        <Textarea
          placeholder="Enter additional stakeholder information..."
          value={getField("additionalStakeholders")}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
            updateField("additionalStakeholders", e.target.value)
          }
          className="max-w-2xl min-h-[80px]"
        />
        <TypingIndicator
          editingUsers={editingUsers}
          fieldName={`${fieldPrefix}-additionalStakeholders`}
        />
      </div>
    </>
  );
}

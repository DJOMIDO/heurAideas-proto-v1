// src/pages/substep/substep-content-card/SubstepContentCard.tsx

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { type Substep, type Subtask } from "@/data/steps";

// 导入子组件
import DescriptionTab from "./DescriptionTab";
import SubtaskHeader from "./SubtaskHeader";
import InfoSection from "./InfoSection";
import PrimaryElementsTable from "./PrimaryElementsTable";
import StakeholderRoleList from "./StakeholderRoleList";
import SaveStatus from "./SaveStatus";

interface SubstepContentCardProps {
  substep: Substep;
  activeTab?: string;
  formData?: Record<string, any>;
  onFormDataChange?: (field: string, value: any) => void;
  lastSaved?: string | null;
  isSaving?: boolean;
}

export default function SubstepContentCard({
  substep,
  activeTab,
  formData = {},
  onFormDataChange,
  lastSaved,
  isSaving = false,
}: SubstepContentCardProps) {
  // 获取当前 Subtask
  const getCurrentSubtask = (): Subtask | null => {
    if (!activeTab || activeTab === "description") return null;
    const subtaskId = activeTab.replace("subtask-", "");
    return substep.subtasks.find((t) => t.id === subtaskId) || null;
  };

  const subtask = getCurrentSubtask();

  // Description Tab
  if (!activeTab || activeTab === "description") {
    return (
      <DescriptionTab
        stepTitle={substep.title}
        description={substep.description}
        lastSaved={lastSaved}
        isSaving={isSaving}
      />
    );
  }

  // Subtask not found
  if (!subtask) {
    return (
      <Card className="flex-1 m-4 border border-gray-200 shadow-sm">
        <CardContent className="px-6">
          <p className="text-sm text-gray-500">Select a tab to view content.</p>
        </CardContent>
      </Card>
    );
  }

  // 辅助函数
  const fieldPrefix = `${activeTab}`;
  const updateField = (field: string, value: any) => {
    onFormDataChange?.(`${fieldPrefix}-${field}`, value);
  };
  const getField = (field: string) => formData[`${fieldPrefix}-${field}`] || "";

  return (
    <Card className="flex-1 m-4 border border-gray-200 shadow-sm">
      {/* 标题 */}
      <SubtaskHeader subtaskId={subtask.id} title={subtask.title} />

      {/* 可滑动内容区 */}
      <CardContent className="px-6">
        <div className="min-h-[400px] max-h-[calc(100vh-300px)] overflow-y-auto pr-2 space-y-6">
          {/* 只读信息块 */}
          <InfoSection label="Objective" content={subtask.objective} />
          <InfoSection label="Actions" content={subtask.actions} />
          <InfoSection
            label="Recommended Documentation"
            content={subtask.recommendedDocumentation}
          />

          {/* 分隔线 */}
          <div className="my-6 border-t border-gray-200" />

          {/* 1. Activity Name */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-800">
              1. Register the activity of interest*
            </label>
            <p className="text-xs text-gray-500 italic">
              *The name given for the activity will be automatically reused for
              the rest of the activity. You can come back here to change it.
            </p>
            <Input
              placeholder="Enter the name of the activity"
              value={getField("activityName")}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                updateField("activityName", e.target.value)
              }
              className="max-w-2xl"
            />
          </div>

          {/* 2. Activity Definition */}
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
          </div>

          {/* 3. Primary Elements Table */}
          <PrimaryElementsTable
            formData={formData}
            onFormDataChange={onFormDataChange!}
            fieldPrefix={fieldPrefix}
          />

          {/* 4. Stakeholders Section */}
          <div className="space-y-4">
            <label className="text-sm font-semibold text-gray-800">
              4. Identify the stakeholders involved in the activity and that
              might be concerned by the SoI use
            </label>

            <div className="space-y-3 max-w-2xl">
              {/* Add SoI stakeholder */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600">
                  Add SoI stakeholder
                </label>
                <Input
                  placeholder="Enter SoI stakeholder"
                  value={getField("soiStakeholder")}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    updateField("soiStakeholder", e.target.value)
                  }
                />
              </div>

              {/* Systems engineer */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600">
                  Systems engineer (Role with the SoI)
                </label>
                <Input
                  placeholder="Enter systems engineer role"
                  value={getField("systemsEngineer")}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    updateField("systemsEngineer", e.target.value)
                  }
                />
              </div>

              {/* SoI stakeholders role library */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-600">
                  SoI stakeholders role library
                </label>
                <StakeholderRoleList
                  formData={formData}
                  onFormDataChange={onFormDataChange!}
                  fieldPrefix={fieldPrefix}
                  initialCount={3}
                />
              </div>
            </div>
          </div>

          {/* 5. Additional Stakeholders */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-800">
              5. Identify the stakeholders involved in the activity and that
              might be concerned by the SoI use
            </label>
            <Textarea
              placeholder="Enter additional stakeholder information..."
              value={getField("additionalStakeholders")}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                updateField("additionalStakeholders", e.target.value)
              }
              className="max-w-2xl min-h-[80px]"
            />
          </div>

          {/* Save Status */}
          <SaveStatus lastSaved={lastSaved} isSaving={isSaving} />
        </div>
      </CardContent>
    </Card>
  );
}

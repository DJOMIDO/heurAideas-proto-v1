// src/pages/substep/substep-content-card/SubstepContentCard.tsx

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { type Substep, type Subtask } from "@/data/steps";

import DescriptionTab from "./DescriptionTab";
import SubtaskHeader from "./SubtaskHeader";
import InfoSection from "./InfoSection";
import PrimaryElementsTable from "./PrimaryElementsTable";
import StakeholderSection from "./StakeholderSection";
import SaveStatus from "./SaveStatus";

interface SubstepContentCardProps {
  substep: Substep;
  activeTab?: string;
  formData?: Record<string, any>;
  onFormDataChange?: (field: string, value: any) => void;
  lastSaved?: string | null;
  isSaving?: boolean;
  isDropTarget?: boolean;
  onDropZoneEnter?: () => void;
  onDropZoneLeave?: () => void;
}

export default function SubstepContentCard({
  substep,
  activeTab,
  formData = {},
  onFormDataChange,
  lastSaved,
  isSaving = false,
  isDropTarget = false,
  onDropZoneEnter,
  onDropZoneLeave,
}: SubstepContentCardProps) {
  // 处理空 activeTab（分屏初始状态）
  if (!activeTab || activeTab === "") {
    return (
      <Card
        className={`
          flex-1 m-4 border border-gray-200 shadow-sm
          ${isDropTarget ? "ring-2 ring-blue-400 ring-inset bg-blue-50/30" : ""}
          transition-all duration-200
        `}
        onDragOver={(e) => {
          e.preventDefault();
          if (isDropTarget) onDropZoneEnter?.();
        }}
        onDragLeave={(e) => {
          if (
            isDropTarget &&
            e.currentTarget.contains(e.relatedTarget as Node)
          ) {
            return;
          }
          onDropZoneLeave?.();
        }}
      >
        <CardContent className="px-6 py-8 flex items-center justify-center h-full">
          <div className="text-center text-gray-500 max-w-sm">
            <div className="mb-4">
              <svg
                className="w-12 h-12 mx-auto text-gray-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-700 mb-2">
              Choose a sub-substep to display
            </p>
            <p className="text-xs text-gray-500">
              Drag and drop tabs from above to this area
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // 获取当前 Subtask
  const getCurrentSubtask = (): Subtask | null => {
    if (activeTab === "description") return null;
    const subtaskId = activeTab.replace("subtask-", "");
    return substep.subtasks?.find((t) => t.id === subtaskId) || null;
  };

  const subtask = getCurrentSubtask();

  // Description Tab
  if (activeTab === "description") {
    return (
      <DescriptionTab
        stepTitle={substep.title}
        description={substep.description}
      />
    );
  }

  // Subtask not found
  if (!subtask) {
    return (
      <Card
        className={`
          flex-1 m-4 border border-gray-200 shadow-sm
          ${isDropTarget ? "ring-2 ring-blue-400 ring-inset bg-blue-50/30" : ""}
          transition-all duration-200
        `}
        onDragOver={(e) => {
          e.preventDefault();
          if (isDropTarget) onDropZoneEnter?.();
        }}
        onDragLeave={(e) => {
          if (
            isDropTarget &&
            e.currentTarget.contains(e.relatedTarget as Node)
          ) {
            return;
          }
          onDropZoneLeave?.();
        }}
      >
        <CardContent className="px-6 py-8 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <p className="text-sm mb-2">Invalid subtask selected</p>
            {isDropTarget && (
              <p className="text-xs text-blue-600 font-medium">
                ← Drop a tab here to load content
              </p>
            )}
          </div>
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
    <Card
      className={`
        flex-1 m-4 border border-gray-200 shadow-sm
        ${isDropTarget ? "ring-2 ring-blue-400 ring-inset bg-blue-50/30" : ""}
        transition-all duration-200
      `}
      onDragOver={(e) => {
        e.preventDefault();
        if (isDropTarget) onDropZoneEnter?.();
      }}
      onDragLeave={(e) => {
        if (isDropTarget && e.currentTarget.contains(e.relatedTarget as Node)) {
          return;
        }
        onDropZoneLeave?.();
      }}
    >
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
          <StakeholderSection
            formData={formData}
            onFormDataChange={onFormDataChange!}
            fieldPrefix={fieldPrefix}
          />

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

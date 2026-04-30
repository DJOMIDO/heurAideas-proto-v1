// frontend/src/pages/substep/substep-content-card/forms/subtask-2-1-a/SubtaskItem.tsx

import { ChevronUp, ChevronDown, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import TypingIndicator from "@/components/TypingIndicator";
import type { SubtaskData, TaskData, Stakeholder } from "./types";

interface SubtaskItemProps {
  subtask: SubtaskData;
  parentTask: TaskData;
  availableStakeholders: Stakeholder[];
  onUpdateSubtask: (updatedSubtask: SubtaskData) => void;
  onToggleExpand: () => void;
  fieldPrefix?: string;
  onFormDataChange?: (field: string, value: any) => void;
  editingUsers?: Record<
    string,
    { userId: number; username: string; timestamp: string }
  >;
}

export default function SubtaskItem({
  subtask,
  parentTask,
  availableStakeholders,
  onUpdateSubtask,
  onToggleExpand,
  fieldPrefix,
  onFormDataChange,
  editingUsers,
}: SubtaskItemProps) {
  const selectedCriteria = subtask.selectedCriteria || [];
  const selectedStakeholders = subtask.selectedStakeholders || [];
  const selectedConstraints = subtask.selectedConstraints || [];

  const fieldNameKey = fieldPrefix
    ? `${fieldPrefix}-subtask-${subtask.id}-name`
    : undefined;

  const toggleSelection = (
    type: "Criteria" | "Stakeholders" | "Constraints",
    id: string,
  ) => {
    const fieldMap = {
      Criteria: "selectedCriteria",
      Stakeholders: "selectedStakeholders",
      Constraints: "selectedConstraints",
    } as const;

    const fieldName = fieldMap[type];
    const currentList =
      type === "Criteria"
        ? selectedCriteria
        : type === "Stakeholders"
          ? selectedStakeholders
          : selectedConstraints;

    const newList = currentList.includes(id)
      ? currentList.filter((item) => item !== id)
      : [...currentList, id];

    onUpdateSubtask({
      ...subtask,
      [fieldName]: newList,
    });
  };

  return (
    <div className="border border-blue-200 rounded-lg bg-white overflow-hidden transition-all duration-200 hover:shadow-md">
      <div className="flex items-center gap-3 p-3 bg-blue-50 border-b border-blue-100">
        <Select
          value={subtask.state}
          onValueChange={(v) => onUpdateSubtask({ ...subtask, state: v })}
        >
          <SelectTrigger className="w-[100px] bg-white border-blue-200 h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="State">State</SelectItem>
            <SelectItem value="None">None</SelectItem>
          </SelectContent>
        </Select>

        <span className="font-mono font-bold text-blue-900 text-sm">
          {subtask.id}
        </span>

        <div className="flex-1">
          <Input
            placeholder="Enter the name of the subtask"
            value={subtask.name}
            onChange={(e) => {
              // 动作 1：触发打字通知
              if (onFormDataChange && fieldNameKey) {
                onFormDataChange(fieldNameKey, e.target.value);
              }
              // 动作 2：更新本地数据
              onUpdateSubtask({ ...subtask, name: e.target.value });
            }}
            className="flex-1 bg-white border-blue-200 h-8 text-sm"
          />
          {/* 动作 3：显示提示（移到输入框下方） */}
          {fieldNameKey && (
            <TypingIndicator
              editingUsers={editingUsers}
              fieldName={fieldNameKey}
            />
          )}
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleExpand}
          className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700"
        >
          {subtask.isExpanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </Button>
      </div>

      {subtask.isExpanded && (
        <div className="p-4 space-y-6 border-t border-blue-100 bg-white">
          {/* 1. Quality Criteria */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
              Subtask Quality Criteria
            </label>
            <div className="flex flex-wrap gap-2">
              {parentTask.qualityCriteria
                .filter((qc) => qc.value)
                .map((qc) => (
                  <Badge
                    key={qc.id}
                    variant={
                      selectedCriteria.includes(qc.id) ? "default" : "outline"
                    }
                    className={`cursor-pointer px-3 py-1.5 transition-all ${
                      selectedCriteria.includes(qc.id)
                        ? "bg-blue-600 text-white hover:bg-blue-700 border-transparent shadow-md"
                        : "bg-gray-50 text-gray-600 hover:border-gray-300 hover:shadow-md border-gray-200"
                    }`}
                    onClick={() => toggleSelection("Criteria", qc.id)}
                  >
                    {qc.value}
                    {selectedCriteria.includes(qc.id) && (
                      <Check className="w-3 h-3 ml-1" />
                    )}
                  </Badge>
                ))}
              {parentTask.qualityCriteria.filter((qc) => qc.value).length ===
                0 && (
                <span className="text-xs text-gray-400 italic">
                  No quality criteria defined in task.
                </span>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
              Subtask Stakeholders
            </label>
            <div className="flex flex-wrap gap-3">
              {availableStakeholders.map((sh) => (
                <div
                  key={sh.id}
                  onClick={() => toggleSelection("Stakeholders", sh.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full border cursor-pointer transition-all ${
                    selectedStakeholders.includes(sh.id)
                      ? "border-blue-500 bg-blue-50 shadow-md"
                      : "border-gray-200 bg-white hover:shadow-md hover:border-gray-300"
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-full ${sh.color} flex items-center justify-center text-white text-[10px] font-bold`}
                  >
                    {sh.name[0]}
                  </div>
                  <span className="text-xs font-medium text-gray-700">
                    {sh.name}
                  </span>
                  {selectedStakeholders.includes(sh.id) && (
                    <Check className="w-3 h-3 text-blue-500" />
                  )}
                </div>
              ))}
              {availableStakeholders.length === 0 && (
                <span className="text-xs text-gray-400 italic">
                  No stakeholders defined in task.
                </span>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
              Subtask Constraints
            </label>
            <div className="flex flex-wrap gap-2">
              {parentTask.constraints
                .filter((c) => c.value)
                .map((c) => (
                  <Badge
                    key={c.id}
                    variant={
                      selectedConstraints.includes(c.id) ? "default" : "outline"
                    }
                    className={`cursor-pointer px-3 py-1.5 transition-all ${
                      selectedConstraints.includes(c.id)
                        ? "bg-blue-600 text-white hover:bg-blue-700 border-transparent shadow-md"
                        : "bg-gray-50 text-gray-600 hover:border-gray-300 hover:shadow-md border-gray-200"
                    }`}
                    onClick={() => toggleSelection("Constraints", c.id)}
                  >
                    {c.value}
                    {selectedConstraints.includes(c.id) && (
                      <Check className="w-3 h-3 ml-1" />
                    )}
                  </Badge>
                ))}
              {parentTask.constraints.filter((c) => c.value).length === 0 && (
                <span className="text-xs text-gray-400 italic">
                  No constraints defined in task.
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

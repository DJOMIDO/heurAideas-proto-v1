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
import type { SubtaskData, TaskData, Stakeholder } from "./types";

interface SubtaskItemProps {
  subtask: SubtaskData;
  parentTask: TaskData;
  availableStakeholders: Stakeholder[];
  onUpdateSubtask: (updatedSubtask: SubtaskData) => void;
  onToggleExpand: () => void;
}

export default function SubtaskItem({
  subtask,
  parentTask,
  availableStakeholders,
  onUpdateSubtask,
  onToggleExpand,
}: SubtaskItemProps) {
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
    const currentList = subtask[fieldName];
    const newList = currentList.includes(id)
      ? currentList.filter((item) => item !== id)
      : [...currentList, id];

    onUpdateSubtask({
      ...subtask,
      [fieldName]: newList,
    });
  };

  return (
    <div className="border border-blue-200 rounded-lg overflow-hidden bg-white shadow-sm">
      <div className="bg-blue-50 p-3 flex items-center gap-3">
        <div className="w-1 h-8 bg-blue-400 rounded-full"></div>

        <Select
          value={subtask.state}
          onValueChange={(v) => onUpdateSubtask({ ...subtask, state: v })}
        >
          <SelectTrigger className="w-[100px] bg-white border-blue-200 h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="State">State</SelectItem>
            <SelectItem value="...">...</SelectItem>
          </SelectContent>
        </Select>

        <span className="font-mono font-bold text-blue-900 text-sm">
          {subtask.id}
        </span>

        <Input
          placeholder="Enter the name of the subtask"
          value={subtask.name}
          onChange={(e) =>
            onUpdateSubtask({ ...subtask, name: e.target.value })
          }
          className="flex-1 bg-white border-blue-200 h-8 text-sm"
        />

        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleExpand}
          className="h-8 w-8 p-0"
        >
          {subtask.isExpanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </Button>
      </div>

      {subtask.isExpanded && (
        <div className="p-4 space-y-6 border-t border-blue-100">
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
                      subtask.selectedCriteria.includes(qc.value)
                        ? "default"
                        : "outline"
                    }
                    className={`cursor-pointer px-3 py-1.5 transition-all ${
                      subtask.selectedCriteria.includes(qc.value)
                        ? "bg-blue-600 text-white hover:bg-blue-700 border-transparent shadow-lg"
                        : "bg-gray-50 text-gray-600 shadow-lg hover:border-gray-300 hover:shadow-lg border-gray-200"
                    }`}
                    onClick={() => toggleSelection("Criteria", qc.value)}
                  >
                    {qc.value}
                    {subtask.selectedCriteria.includes(qc.value) && (
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
                    subtask.selectedStakeholders.includes(sh.id)
                      ? "border-blue-500 bg-blue-50 shadow-lg"
                      : "border-gray-200 bg-white shadow-lg hover:shadow-lg hover:border-gray-300"
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
                  {subtask.selectedStakeholders.includes(sh.id) && (
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
              {parentTask.constraints.map((c) => {
                const label = c.value || "Description...";
                return (
                  <Badge
                    key={c.id}
                    variant={
                      subtask.selectedConstraints.includes(c.id)
                        ? "default"
                        : "outline"
                    }
                    className={`cursor-pointer px-3 py-1.5 transition-all ${
                      subtask.selectedConstraints.includes(c.id)
                        ? "bg-blue-600 text-white hover:bg-blue-700 border-transparent shadow-lg"
                        : "bg-gray-50 text-gray-600 shadow-lg hover:border-gray-300 hover:shadow-lg border-gray-200"
                    }`}
                    onClick={() => toggleSelection("Constraints", c.id)}
                  >
                    {label}
                    {subtask.selectedConstraints.includes(c.id) && (
                      <Check className="w-3 h-3 ml-1" />
                    )}
                  </Badge>
                );
              })}
              {parentTask.constraints.length === 0 && (
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

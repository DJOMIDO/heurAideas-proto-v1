// src/pages/substep/substep-content-card/StakeholderRoleList.tsx

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";

interface StakeholderRoleListProps {
  formData: Record<string, any>;
  onFormDataChange: (field: string, value: any) => void;
  fieldPrefix: string;
  initialCount?: number;
}

export default function StakeholderRoleList({
  formData,
  onFormDataChange,
  fieldPrefix,
  initialCount = 3,
}: StakeholderRoleListProps) {
  const [count, setCount] = useState(initialCount);

  const getField = (field: string) => formData[`${fieldPrefix}-${field}`] || "";
  const updateField = (field: string, value: any) => {
    onFormDataChange(`${fieldPrefix}-${field}`, value);
  };

  return (
    <div className="border border-gray-200 rounded-lg p-3 max-h-[200px] overflow-y-auto space-y-2">
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className="flex gap-2 items-center">
          <Input
            placeholder={`Stakeholder role ${idx + 1}`}
            value={getField(`stakeholder-role-${idx}`)}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              updateField(`stakeholder-role-${idx}`, e.target.value)
            }
            className="flex-1 min-w-0"
          />
          {count > 1 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 shrink-0 text-red-500 hover:text-red-700 hover:bg-red-50"
              onClick={() => setCount((prev) => prev - 1)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      ))}

      <Button
        variant="outline"
        size="sm"
        className="w-full mt-2"
        onClick={() => setCount((prev) => prev + 1)}
      >
        <Plus className="w-4 h-4 mr-2" />
        Add Stakeholder Role
      </Button>
    </div>
  );
}

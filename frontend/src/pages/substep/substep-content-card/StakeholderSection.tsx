// src/pages/substep/substep-content-card/StakeholderSection.tsx

import { useState, useRef, useEffect } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";

interface Stakeholder {
  id: string;
  name: string;
  role: string;
  color: string;
}

interface StakeholderSectionProps {
  formData: Record<string, any>;
  onFormDataChange: (field: string, value: any) => void;
  fieldPrefix: string;
}

const AVATAR_COLORS = [
  "bg-purple-500",
  "bg-blue-500",
  "bg-green-500",
  "bg-yellow-500",
  "bg-red-500",
  "bg-indigo-500",
  "bg-pink-500",
  "bg-teal-500",
];

const getColor = (index: number) => AVATAR_COLORS[index % AVATAR_COLORS.length];

const getTextColor = (color: string) => {
  const colorMap: Record<string, string> = {
    "bg-purple-500": "text-purple-500",
    "bg-blue-500": "text-blue-500",
    "bg-green-500": "text-green-500",
    "bg-yellow-500": "text-yellow-500",
    "bg-red-500": "text-red-500",
    "bg-indigo-500": "text-indigo-500",
    "bg-pink-500": "text-pink-500",
    "bg-teal-500": "text-teal-500",
  };
  return colorMap[color] || "text-gray-500";
};

const getInitials = (name: string) =>
  name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

export default function StakeholderSection({
  formData,
  onFormDataChange,
  fieldPrefix,
}: StakeholderSectionProps) {
  const [showAll, setShowAll] = useState(true);
  const [addingStakeholder, setAddingStakeholder] = useState<{
    name: string;
    role: string;
  } | null>(null);

  const roleInputRef = useRef<HTMLInputElement>(null);

   useEffect(() => {
    setAddingStakeholder(null);
  }, [fieldPrefix]);

  const getStakeholders = (): Stakeholder[] => {
    const stakeholders: Stakeholder[] = [];
    let idx = 0;

    while (true) {
      const name = formData[`${fieldPrefix}-stakeholder-role-${idx}`];
      if (!name) break;

      const role =
        formData[`${fieldPrefix}-stakeholder-role-${idx}-role`] || "";

      stakeholders.push({
        id: `stakeholder-${idx}`,
        name: name,
        role: role,
        color: getColor(idx),
      });
      idx++;
    }

    return stakeholders;
  };

  const stakeholders = getStakeholders();
  const displayStakeholders = showAll ? stakeholders : stakeholders.slice(0, 6);
  const hasMore = stakeholders.length > 6;

  const handleConfirmAdd = () => {
    if (!addingStakeholder?.name) return;

    const nextIdx = displayStakeholders.length;

    onFormDataChange(
      `${fieldPrefix}-stakeholder-role-${nextIdx}`,
      addingStakeholder.name,
    );

    if (addingStakeholder.role) {
      onFormDataChange(
        `${fieldPrefix}-stakeholder-role-${nextIdx}-role`,
        addingStakeholder.role,
      );
    }

    setAddingStakeholder(null);
  };

  const handleDeleteStakeholder = (index: number) => {
    const updatedStakeholders = [...stakeholders];
    updatedStakeholders.splice(index, 1);

    updatedStakeholders.forEach((s, idx) => {
      onFormDataChange(`${fieldPrefix}-stakeholder-role-${idx}`, s.name);
      onFormDataChange(`${fieldPrefix}-stakeholder-role-${idx}-role`, s.role);
    });

    for (let i = updatedStakeholders.length; i < stakeholders.length; i++) {
      onFormDataChange(`${fieldPrefix}-stakeholder-role-${i}`, "");
      onFormDataChange(`${fieldPrefix}-stakeholder-role-${i}-role`, "");
    }
  };

  return (
    <div className="space-y-2">
      <div>
        <h3 className="text-sm font-semibold text-gray-800">
          4. Identify the stakeholders involved in the activity and that might
          be concerned by the SoI use
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {addingStakeholder && (
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-blue-200">
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
              <Plus className="w-5 h-5 text-blue-400" />
            </div>

            <div className="flex-1 min-w-0 space-y-1">
              <input
                autoFocus
                placeholder="Name"
                value={addingStakeholder.name}
                onChange={(e) =>
                  setAddingStakeholder({
                    ...addingStakeholder,
                    name: e.target.value,
                  })
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    roleInputRef.current?.focus();
                  }
                  if (e.key === "Escape") {
                    setAddingStakeholder(null);
                  }
                }}
                className="w-full h-7 text-sm font-medium border-0 p-0 focus-visible:ring-0 bg-transparent placeholder-gray-400"
              />

              <input
                ref={roleInputRef}
                placeholder="Role"
                value={addingStakeholder.role}
                onChange={(e) =>
                  setAddingStakeholder({
                    ...addingStakeholder,
                    role: e.target.value,
                  })
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleConfirmAdd();
                  }
                  if (e.key === "Escape") {
                    setAddingStakeholder(null);
                  }
                }}
                className="w-full h-5 text-xs text-gray-500 border-0 p-0 focus-visible:ring-0 bg-transparent placeholder-gray-400"
              />
            </div>

            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-gray-400 hover:text-red-500 hover:bg-transparent shrink-0"
              onClick={() => setAddingStakeholder(null)}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        )}

        {!addingStakeholder && (
          <Button
            variant="ghost"
            className="h-auto p-4 justify-start gap-3 hover:bg-gray-50 w-full"
            onClick={() => setAddingStakeholder({ name: "", role: "" })}
          >
            <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
              <Plus className="w-5 h-5 text-gray-400" />
            </div>
            <span className="text-sm text-gray-600 font-medium">
              Add Stakeholder
            </span>
          </Button>
        )}

        {displayStakeholders.map((stakeholder, idx) => (
          <div
            key={stakeholder.id}
            className="group flex items-center gap-3 p-4 hover:bg-gray-50 rounded-lg transition-all"
          >
            <div
              className={`relative shrink-0 h-10 w-10 rounded-full ${stakeholder.color} p-1`}
            >
              <Avatar className="h-full w-full">
                <AvatarFallback
                  className={`${getTextColor(stakeholder.color)} font-bold`}
                >
                  {getInitials(stakeholder.name)}
                </AvatarFallback>
              </Avatar>
            </div>

            <div className="flex-1 min-w-0 space-y-1">
              <span className="block text-sm font-medium text-gray-800 truncate">
                {stakeholder.name}
              </span>

              <input
                value={stakeholder.role}
                onChange={(e) => {
                  onFormDataChange(
                    `${fieldPrefix}-stakeholder-role-${idx}-role`,
                    e.target.value,
                  );
                }}
                placeholder="+ Add role"
                className="block text-xs text-gray-500 truncate border-0 p-0 focus-visible:ring-0 bg-transparent placeholder-gray-400 w-full h-5 min-h-[1.25rem]"
              />
            </div>

            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 hover:bg-transparent shrink-0"
              onClick={() => handleDeleteStakeholder(idx)}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        ))}

        {hasMore && !showAll && !addingStakeholder && (
          <Button
            variant="ghost"
            className="h-auto p-4 justify-start gap-3 hover:bg-gray-50 w-full"
            onClick={() => setShowAll(true)}
          >
            <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
              <Plus className="w-5 h-5 text-gray-400" />
            </div>
            <span className="text-sm text-gray-600 font-medium">
              Show More ({stakeholders.length - 6})
            </span>
          </Button>
        )}

        {showAll && hasMore && !addingStakeholder && (
          <Button
            variant="ghost"
            className="h-auto p-4 justify-start gap-3 hover:bg-gray-50 w-full"
            onClick={() => setShowAll(false)}
          >
            <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
              <Plus className="w-5 h-5 text-gray-400 rotate-45" />
            </div>
            <span className="text-sm text-gray-600 font-medium">Show Less</span>
          </Button>
        )}
      </div>
    </div>
  );
}

// src/pages/substep/substep-content-card/forms/subtask-1-1-a/StakeholderSection.tsx

import { useState, useRef, useEffect } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";
import { getStakeholderRoles } from "@/api/projects";
import { getInitials } from "@/utils/string";
import TypingIndicator from "@/components/TypingIndicator";

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
  editingUsers?: Record<
    string,
    { userId: number; username: string; timestamp: string }
  >;
  conflictFields?: Record<string, { username: string; timestamp: string }>;
  currentUserId?: number;
  onConflictResolve?: (field: string) => void;
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

const limitToThreeRolesOnSave = (roleString: string): string => {
  const roles = roleString
    .split(",")
    .map((r) => r.trim())
    .filter((r) => r);
  return roles.slice(0, 3).join(", ");
};

export default function StakeholderSection({
  formData,
  onFormDataChange,
  fieldPrefix,
  editingUsers = {},
}: StakeholderSectionProps) {
  const [showAll, setShowAll] = useState(true);
  const [addingStakeholder, setAddingStakeholder] = useState<{
    name: string;
    role: string;
  } | null>(null);

  const [roleSuggestions, setRoleSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [editingRoleIdx, setEditingRoleIdx] = useState<number | null>(null);

  const roleInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const roleInputRefs = useRef<Map<number, HTMLInputElement>>(new Map());
  const isSelectingRef = useRef(false);

  const getProjectIdFromUrl = (): number => {
    const path = window.location.pathname;
    const match = path.match(/\/substep\/(\d+)\//);
    if (match && match[1]) {
      return Number(match[1]);
    }
    const parts = path.split("/");
    return Number(parts[3]) || 0;
  };

  const projectId = getProjectIdFromUrl();

  // 加载已有 roles
  useEffect(() => {
    if (projectId && projectId > 0) {
      getStakeholderRoles(projectId)
        .then((roles) => {
          setRoleSuggestions(roles);
        })
        .catch((error) => {
          console.error("[StakeholderSection] Failed to load roles:", error);
        });
    }
  }, [projectId]);

  // 点击外部关闭下拉列表
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
        setEditingRoleIdx(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 切换 subtask 时重置
  useEffect(() => {
    setAddingStakeholder(null);
    setEditingRoleIdx(null);
    setShowSuggestions(false);
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
        limitToThreeRolesOnSave(addingStakeholder.role),
      );
    }

    setAddingStakeholder(null);
    setShowSuggestions(false);
    setEditingRoleIdx(null);
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

  const handleRoleChange = (idx: number, value: string) => {
    onFormDataChange(`${fieldPrefix}-stakeholder-role-${idx}-role`, value);
  };

  const handleRoleBlur = (idx: number, value: string) => {
    if (isSelectingRef.current) return;

    const limitedValue = limitToThreeRolesOnSave(value);
    if (limitedValue !== value) {
      onFormDataChange(
        `${fieldPrefix}-stakeholder-role-${idx}-role`,
        limitedValue,
      );
    }
    setEditingRoleIdx(null);
    setShowSuggestions(false);
  };

  const handleRoleKeyDown = (idx: number, value: string) => {
    const limitedValue = limitToThreeRolesOnSave(value);
    onFormDataChange(
      `${fieldPrefix}-stakeholder-role-${idx}-role`,
      limitedValue,
    );

    const input = roleInputRefs.current.get(idx);
    if (input) {
      input.blur();
    }

    setEditingRoleIdx(null);
    setShowSuggestions(false);
  };

  const handleExistingRoleFocus = (idx: number) => {
    setEditingRoleIdx(idx);
    setShowSuggestions(true);
  };

  const handleExistingRoleSelect = (idx: number, role: string) => {
    isSelectingRef.current = true;

    const currentRole =
      formData[`${fieldPrefix}-stakeholder-role-${idx}-role`] || "";
    const roles = currentRole
      .split(",")
      .map((r: string) => r.trim())
      .filter((r: string) => r);

    const roleIndex = roles.indexOf(role);
    if (roleIndex > -1) {
      roles.splice(roleIndex, 1);
    } else {
      roles.push(role);
    }

    const limitedRoles = roles.slice(0, 3);
    handleRoleChange(idx, limitedRoles.join(", "));

    const input = roleInputRefs.current.get(idx);
    input?.focus();

    setTimeout(() => {
      isSelectingRef.current = false;
    }, 100);
  };

  const handleAddingRoleChange = (value: string) => {
    setAddingStakeholder((prev) => (prev ? { ...prev, role: value } : null));
  };

  const handleAddingRoleSelect = (role: string) => {
    isSelectingRef.current = true;

    const currentRole = addingStakeholder?.role || "";
    const roles = currentRole
      .split(",")
      .map((r: string) => r.trim())
      .filter((r: string) => r);

    const roleIndex = roles.indexOf(role);
    if (roleIndex > -1) {
      roles.splice(roleIndex, 1);
    } else {
      roles.push(role);
    }

    const limitedRoles = roles.slice(0, 3);
    setAddingStakeholder((prev) =>
      prev ? { ...prev, role: limitedRoles.join(", ") } : null,
    );

    roleInputRef.current?.focus();

    setTimeout(() => {
      isSelectingRef.current = false;
    }, 100);
  };

  const getFilteredSuggestions = (currentRole: string) => {
    const selectedRoles = currentRole
      .split(",")
      .map((r: string) => r.trim())
      .filter((r: string) => r);
    return roleSuggestions.filter((role) => !selectedRoles.includes(role));
  };

  return (
    <div className="space-y-2">
      <div>
        <h3 className="text-sm font-semibold text-gray-800">
          4. Identify the stakeholders involved in the activity and that might
          be concerned by the SoI use *
        </h3>
        <p className="text-xs text-gray-500 mt-1 italic">
          * Enter up to 3 roles per stakeholder, separated by commas. Press
          Enter or click outside to save. Additional roles will not be saved.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Add Stakeholder 展开输入框 */}
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
                    setShowSuggestions(false);
                    setEditingRoleIdx(null);
                  }
                }}
                className="w-full h-7 text-sm font-medium border-0 p-0 focus-visible:ring-0 bg-transparent placeholder-gray-400"
              />
              {/* 显示编辑提示 */}
              {addingStakeholder && (
                <TypingIndicator
                  editingUsers={editingUsers}
                  fieldName={`${fieldPrefix}-stakeholder-role-${displayStakeholders.length}-name`}
                />
              )}

              {/* Role 输入框 */}
              <div className="relative">
                <input
                  ref={roleInputRef}
                  placeholder="Role"
                  value={addingStakeholder.role}
                  onChange={(e) => handleAddingRoleChange(e.target.value)}
                  onFocus={() => {
                    setShowSuggestions(true);
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowSuggestions(true);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleConfirmAdd();
                    }
                    if (e.key === "Escape") {
                      setAddingStakeholder(null);
                      setShowSuggestions(false);
                      setEditingRoleIdx(null);
                    }
                  }}
                  onBlur={() => {
                    if (isSelectingRef.current) return;

                    setTimeout(() => {
                      setShowSuggestions(false);
                      if (addingStakeholder?.name) {
                        handleConfirmAdd();
                      }
                    }, 200);
                  }}
                  className="w-full h-8 text-xs text-gray-900 border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white placeholder-gray-400 cursor-text"
                  tabIndex={0}
                />
                {/* 显示编辑提示 */}
                <TypingIndicator
                  editingUsers={editingUsers}
                  fieldName={`${fieldPrefix}-stakeholder-role-adding-role`}
                />

                {/* 下拉列表 - 添加模式 */}
                {showSuggestions &&
                  addingStakeholder &&
                  roleSuggestions.length > 0 && (
                    <div
                      ref={suggestionsRef}
                      className="absolute top-full left-0 mt-1 w-full max-h-48 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg z-50"
                    >
                      {getFilteredSuggestions(addingStakeholder.role).map(
                        (role: string) => (
                          <button
                            key={role}
                            onMouseDown={(e) => {
                              e.preventDefault();
                            }}
                            onClick={() => handleAddingRoleSelect(role)}
                            className="w-full px-3 py-2 text-left text-xs text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                            type="button"
                          >
                            {role}
                          </button>
                        ),
                      )}
                    </div>
                  )}
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-gray-400 hover:text-red-500 hover:bg-transparent shrink-0"
              onClick={() => {
                setAddingStakeholder(null);
                setShowSuggestions(false);
                setEditingRoleIdx(null);
              }}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        )}

        {/* Add Button */}
        {!addingStakeholder && (
          <Button
            variant="ghost"
            className="h-auto p-4 justify-start gap-3 hover:bg-gray-50 w-full"
            onClick={() => {
              setAddingStakeholder({ name: "", role: "" });
              setShowSuggestions(false);
              setEditingRoleIdx(null);
            }}
          >
            <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
              <Plus className="w-5 h-5 text-gray-400" />
            </div>
            <span className="text-sm text-gray-600 font-medium">
              Add Stakeholder
            </span>
          </Button>
        )}

        {/* 已添加的卡片 */}
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
              {/* 显示编辑提示 */}
              <TypingIndicator
                editingUsers={editingUsers}
                fieldName={`${fieldPrefix}-stakeholder-role-${idx}-name`}
              />

              {/* Role 输入框 */}
              <div className="relative">
                <input
                  ref={(el) => {
                    if (el) {
                      roleInputRefs.current.set(idx, el);
                    } else {
                      roleInputRefs.current.delete(idx);
                    }
                  }}
                  value={stakeholder.role}
                  onChange={(e) => handleRoleChange(idx, e.target.value)}
                  onBlur={() => handleRoleBlur(idx, stakeholder.role)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleRoleKeyDown(
                        idx,
                        (e.target as HTMLInputElement).value,
                      );
                    }
                  }}
                  onFocus={() => handleExistingRoleFocus(idx)}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleExistingRoleFocus(idx);
                  }}
                  placeholder="+ Add role"
                  className="block text-xs text-gray-500 truncate border-0 p-0 focus-visible:ring-0 bg-transparent placeholder-gray-400 w-full h-5 min-h-[1.25rem]"
                />

                {/* 下拉列表 - 已有 Stakeholder 模式 */}
                {showSuggestions &&
                  editingRoleIdx === idx &&
                  roleSuggestions.length > 0 && (
                    <div
                      ref={suggestionsRef}
                      className="absolute top-full left-0 mt-1 w-full max-h-48 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg z-50"
                    >
                      {getFilteredSuggestions(stakeholder.role).map(
                        (role: string) => (
                          <button
                            key={role}
                            onMouseDown={(e) => {
                              e.preventDefault();
                            }}
                            onClick={() => handleExistingRoleSelect(idx, role)}
                            className="w-full px-3 py-2 text-left text-xs text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                            type="button"
                          >
                            {role}
                          </button>
                        ),
                      )}
                    </div>
                  )}
              </div>
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

        {/* Show More / Show Less */}
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

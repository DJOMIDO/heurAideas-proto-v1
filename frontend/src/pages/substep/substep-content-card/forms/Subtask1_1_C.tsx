// frontend/src/pages/substep/substep-content-card/forms/Subtask1_1_C.tsx

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import TypingIndicator from "@/components/TypingIndicator";
import { generateIdSequence } from "@/utils/generateIds";

interface Subtask1_1_CProps {
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

export default function Subtask1_1_C({
  fieldPrefix,
  formData,
  onFormDataChange,
  editingUsers = {},
}: Subtask1_1_CProps) {
  const getField = (key: string) => formData[`${fieldPrefix}-${key}`] || "";
  const updateField = (key: string, value: any) => {
    onFormDataChange(`${fieldPrefix}-${key}`, value);
  };

  // Table 1 (Needs) State - 2 rows by default
  const [needsRows, setNeedsRows] = useState(() => {
    let count = 0;
    while (getField(`needs-${count}-need`) || getField(`needs-${count}-source`))
      count++;
    return Math.max(2, count);
  });

  // Table 2 (Effects) State - 2 rows by default
  const [effectsRows, setEffectsRows] = useState(() => {
    let count = 0;
    while (
      getField(`effects-${count}-name`) ||
      getField(`effects-${count}-effects`)
    )
      count++;
    return Math.max(2, count);
  });

  // Needs Handlers
  const addNeedRow = () => setNeedsRows((p) => p + 1);
  const removeNeedRow = (idx: number) => {
    if (needsRows <= 1) return;
    const cols = ["need", "source"];
    cols.forEach((col) => updateField(`needs-${idx}-${col}`, ""));
    for (let i = idx + 1; i < needsRows; i++) {
      cols.forEach((col) =>
        updateField(`needs-${i - 1}-${col}`, getField(`needs-${i}-${col}`)),
      );
    }
    setNeedsRows((p) => p - 1);
  };

  // Effects Handlers
  const addEffectRow = () => setEffectsRows((p) => p + 1);
  const removeEffectRow = (idx: number) => {
    if (effectsRows <= 1) return;
    const cols = ["name", "effects", "quality", "measurement", "source"];
    cols.forEach((col) => updateField(`effects-${idx}-${col}`, ""));
    for (let i = idx + 1; i < effectsRows; i++) {
      cols.forEach((col) =>
        updateField(`effects-${i - 1}-${col}`, getField(`effects-${i}-${col}`)),
      );
    }
    setEffectsRows((p) => p - 1);
  };

  return (
    <div className="space-y-8">
      {/* 1. Targeted Mission */}
      <div className="space-y-2">
        <label className="text-sm font-bold text-black">
          1. Fill the targeted mission(s) realised by the SoI.
        </label>
        <Input
          placeholder="Enter the name of the SoI"
          value={getField("mission")}
          onChange={(e) => updateField("mission", e.target.value)}
          className="max-w-2xl"
        />
        <TypingIndicator
          editingUsers={editingUsers}
          fieldName={`${fieldPrefix}-mission`}
        />
      </div>

      {/* 2. Needs Table */}
      <div className="space-y-2">
        <label className="text-sm font-bold text-black">
          2. Register the needs aimed to be satisfied by the SoI.
        </label>
        <div className="overflow-x-auto border border-gray-200 rounded-lg bg-white">
          <table className="min-w-[600px] w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-bold text-black tracking-wider w-20">
                  ID
                </th>
                <th className="px-3 py-2 text-left text-xs font-bold text-black tracking-wider">
                  Need
                </th>
                <th className="px-3 py-2 text-left text-xs font-bold text-black tracking-wider">
                  Source
                </th>
                <th className="px-3 py-2 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {/* Generate ID sequence */}
              {useMemo(
                () => generateIdSequence("N", needsRows),
                [needsRows],
              ).map((autoId, idx) => (
                <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                  {/* ID */}
                  <td className="px-3 py-2">
                    <span className="text-xs font-mono text-gray-600">
                      {autoId}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <Input
                      placeholder="Enter need"
                      value={getField(`needs-${idx}-need`)}
                      onChange={(e) =>
                        updateField(`needs-${idx}-need`, e.target.value)
                      }
                      className="h-8 text-xs"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <Input
                      placeholder="Enter source"
                      value={getField(`needs-${idx}-source`)}
                      onChange={(e) =>
                        updateField(`needs-${idx}-source`, e.target.value)
                      }
                      className="h-8 text-xs"
                    />
                  </td>
                  <td className="px-2 py-2 text-center">
                    {needsRows > 1 && (
                      <button
                        type="button"
                        onClick={() => removeNeedRow(idx)}
                        className="inline-flex items-center justify-center rounded-md p-1 text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={addNeedRow}
          className="mt-2"
        >
          <Plus className="w-4 h-4 mr-2" /> Add Row
        </Button>
        <TypingIndicator
          editingUsers={editingUsers}
          fieldName={`${fieldPrefix}-needs-table`}
        />
      </div>

      {/* 3. Effects Table */}
      <div className="space-y-2">
        <label className="text-sm font-bold text-black">
          3. Add the expected effects (i.e. functions) intended by the Human-AI
          interaction, then associate them their quality criteria.
        </label>
        <div className="overflow-x-auto border border-gray-200 rounded-lg bg-white">
          <table className="min-w-[1000px] w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-bold text-black tracking-wider w-16">
                  ID
                </th>
                <th className="px-3 py-2 text-left text-xs font-bold text-black tracking-wider">
                  Name
                </th>
                <th className="px-3 py-2 text-left text-xs font-bold text-black tracking-wider">
                  Effects
                </th>
                <th className="px-3 py-2 text-left text-xs font-bold text-black tracking-wider">
                  Quality criteria
                </th>
                <th className="px-3 py-2 text-left text-xs font-bold text-black tracking-wider">
                  Measurement methods
                </th>
                <th className="px-3 py-2 text-left text-xs font-bold text-black tracking-wider">
                  Source
                </th>
                <th className="px-3 py-2 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {/* Generate ID sequence */}
              {useMemo(
                () => generateIdSequence("E", effectsRows),
                [effectsRows],
              ).map((autoId, idx) => (
                <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                  {/* ID */}
                  <td className="px-3 py-2">
                    <span className="text-xs font-mono text-gray-600">
                      {autoId}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <Input
                      placeholder="Enter name"
                      value={getField(`effects-${idx}-name`)}
                      onChange={(e) =>
                        updateField(`effects-${idx}-name`, e.target.value)
                      }
                      className="h-8 text-xs"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <Input
                      placeholder="Enter effects"
                      value={getField(`effects-${idx}-effects`)}
                      onChange={(e) =>
                        updateField(`effects-${idx}-effects`, e.target.value)
                      }
                      className="h-8 text-xs"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <Input
                      placeholder="Enter quality criteria"
                      value={getField(`effects-${idx}-quality`)}
                      onChange={(e) =>
                        updateField(`effects-${idx}-quality`, e.target.value)
                      }
                      className="h-8 text-xs"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <Input
                      placeholder="Enter measurement methods"
                      value={getField(`effects-${idx}-measurement`)}
                      onChange={(e) =>
                        updateField(
                          `effects-${idx}-measurement`,
                          e.target.value,
                        )
                      }
                      className="h-8 text-xs"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <Input
                      placeholder="Enter source"
                      value={getField(`effects-${idx}-source`)}
                      onChange={(e) =>
                        updateField(`effects-${idx}-source`, e.target.value)
                      }
                      className="h-8 text-xs"
                    />
                  </td>
                  <td className="px-2 py-2 text-center">
                    {effectsRows > 1 && (
                      <button
                        type="button"
                        onClick={() => removeEffectRow(idx)}
                        className="inline-flex items-center justify-center rounded-md p-1 text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={addEffectRow}
          className="mt-2"
        >
          <Plus className="w-4 h-4 mr-2" /> Add Row
        </Button>
        <TypingIndicator
          editingUsers={editingUsers}
          fieldName={`${fieldPrefix}-effects-table`}
        />
      </div>
    </div>
  );
}

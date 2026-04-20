// frontend/src/pages/substep/substep-content-card/forms/Subtask1_1_B.tsx

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import TypingIndicator from "@/components/TypingIndicator";
import { generateIdSequence } from "@/utils/generateIds";

interface Subtask1_1_BProps {
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

export default function Subtask1_1_B({
  fieldPrefix,
  formData,
  onFormDataChange,
  editingUsers = {},
}: Subtask1_1_BProps) {
  const getField = (key: string) => formData[`${fieldPrefix}-${key}`] || "";
  const updateField = (key: string, value: any) => {
    onFormDataChange(`${fieldPrefix}-${key}`, value);
  };

  // Point 2: Docs Table State -  2 rows by default
  const [docRows, setDocRows] = useState(() => {
    let count = 0;
    while (getField(`docs-${count}-type`) || getField(`docs-${count}-title`))
      count++;
    return Math.max(2, count);
  });

  // Point 3: Parts Table State - 2 rows and 2 cols by default
  const [partRows, setPartRows] = useState(() => {
    let count = 0;
    while (getField(`parts-${count}-0`)) count++;
    return Math.max(2, count);
  });
  const [partCols, setPartCols] = useState(() => {
    let maxCol = 1;
    for (let r = 0; r < 10; r++) {
      let c = 1;
      while (getField(`parts-${r}-${c}`)) c++;
      if (c > 1) maxCol = Math.max(maxCol, c - 1);
    }
    return maxCol;
  });

  // Docs Table Handlers
  const addDocRow = () => setDocRows((p) => p + 1);
  const removeDocRow = (idx: number) => {
    if (docRows <= 1) return;
    const cols = ["type", "title", "concepts", "definitions", "link"];
    cols.forEach((col) => updateField(`docs-${idx}-${col}`, ""));
    for (let i = idx + 1; i < docRows; i++) {
      cols.forEach((col) =>
        updateField(`docs-${i - 1}-${col}`, getField(`docs-${i}-${col}`)),
      );
    }
    setDocRows((p) => p - 1);
  };

  // Parts Table Handlers
  const addPartRow = () => setPartRows((p) => p + 1);
  const removePartRow = (idx: number) => {
    if (partRows <= 1) return;
    for (let c = 0; c <= partCols; c++) updateField(`parts-${idx}-${c}`, "");
    for (let i = idx + 1; i < partRows; i++) {
      for (let c = 0; c <= partCols; c++) {
        updateField(`parts-${i - 1}-${c}`, getField(`parts-${i}-${c}`));
      }
    }
    setPartRows((p) => p - 1);
  };
  const addPartCol = () => setPartCols((p) => p + 1);
  const removePartCol = (idx: number) => {
    if (partCols <= 1) return;
    for (let r = 0; r < partRows; r++) {
      updateField(`parts-${r}-${idx + 1}`, "");
    }
    for (let i = idx + 1; i < partCols; i++) {
      for (let r = 0; r < partRows; r++) {
        updateField(`parts-${r}-${i}`, getField(`parts-${r}-${i + 1}`));
      }
    }
    for (let r = 0; r < partRows; r++) {
      updateField(`parts-${r}-${partCols}`, "");
    }
    setPartCols((p) => p - 1);
  };

  return (
    <div className="space-y-8">
      {/* 1. Register SoI */}
      <div className="space-y-2">
        <label className="text-sm font-bold text-black">
          1. Register the system of interest (SoI)
        </label>
        <Input
          placeholder="Enter the name of the SoI"
          value={getField("soiName")}
          onChange={(e) => updateField("soiName", e.target.value)}
          className="max-w-2xl"
        />
        <TypingIndicator
          editingUsers={editingUsers}
          fieldName={`${fieldPrefix}-soiName`}
        />
      </div>

      {/* 2. Norms & Standards Table */}
      <div className="space-y-2">
        <label className="text-sm font-bold text-black">
          2. Enter the norms, standards and any other documentation of reference
          used to characterise or define the SoI.
        </label>
        <div className="overflow-x-auto border border-gray-200 rounded-lg bg-white">
          <table className="min-w-[800px] w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-bold text-black tracking-wider w-20">
                  ID
                </th>
                <th className="px-3 py-2 text-left text-xs font-bold text-black tracking-wider w-32">
                  Type
                </th>
                <th className="px-3 py-2 text-left text-xs font-bold text-black tracking-wider">
                  Title
                </th>
                <th className="px-3 py-2 text-left text-xs font-bold text-black tracking-wider w-48">
                  Core concepts
                </th>
                <th className="px-3 py-2 text-left text-xs font-bold text-black tracking-wider w-48">
                  Definitions
                </th>
                <th className="px-3 py-2 text-left text-xs font-bold text-black tracking-wider w-48">
                  Link
                </th>
                <th className="px-3 py-2 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {useMemo(() => generateIdSequence("D", docRows), [docRows]).map(
                (autoId, idx) => (
                  <tr
                    key={idx}
                    className="hover:bg-gray-50/50 transition-colors"
                  >
                    {/* ID */}
                    <td className="px-3 py-2 align-top">
                      <span className="text-xs font-mono text-gray-600">
                        {autoId}
                      </span>
                    </td>

                    {/* Type */}
                    <td className="px-3 py-2 align-top">
                      <Textarea
                        placeholder="Enter Doc Type"
                        value={getField(`docs-${idx}-type`)}
                        onChange={(e) =>
                          updateField(`docs-${idx}-type`, e.target.value)
                        }
                        className="min-h-[80px] text-xs resize-y"
                        rows={3}
                      />
                    </td>

                    {/* Title */}
                    <td className="px-3 py-2 align-top">
                      <Textarea
                        placeholder="Enter a Title"
                        value={getField(`docs-${idx}-title`)}
                        onChange={(e) =>
                          updateField(`docs-${idx}-title`, e.target.value)
                        }
                        className="min-h-[80px] text-xs resize-y"
                        rows={3}
                      />
                    </td>

                    {/* Core concepts / Definitions / Link */}
                    <td className="px-3 py-2 align-top">
                      <Textarea
                        placeholder="+ Add concepts"
                        value={getField(`docs-${idx}-concepts`)}
                        onChange={(e) =>
                          updateField(`docs-${idx}-concepts`, e.target.value)
                        }
                        className="min-h-[80px] text-xs resize-y"
                        rows={3}
                      />
                    </td>
                    <td className="px-3 py-2 align-top">
                      <Textarea
                        placeholder="+ Add definition"
                        value={getField(`docs-${idx}-definitions`)}
                        onChange={(e) =>
                          updateField(`docs-${idx}-definitions`, e.target.value)
                        }
                        className="min-h-[80px] text-xs resize-y"
                        rows={3}
                      />
                    </td>
                    <td className="px-3 py-2 align-top">
                      <Textarea
                        placeholder="+ Add to doc manager"
                        value={getField(`docs-${idx}-link`)}
                        onChange={(e) =>
                          updateField(`docs-${idx}-link`, e.target.value)
                        }
                        className="min-h-[80px] text-xs resize-y"
                        rows={3}
                      />
                    </td>

                    {/* Remove Button */}
                    <td className="px-2 py-2 text-center align-top">
                      {docRows > 1 && (
                        <button
                          type="button"
                          onClick={() => removeDocRow(idx)}
                          className="inline-flex items-center justify-center rounded-md p-1 text-red-500 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={addDocRow}
          className="mt-2"
        >
          <Plus className="w-4 h-4 mr-2" /> Add Row
        </Button>
        <TypingIndicator
          editingUsers={editingUsers}
          fieldName={`${fieldPrefix}-docs-table`}
        />
      </div>

      {/* 3. Concepts & Parts Table */}
      <div className="space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <label className="text-sm font-bold text-black">
            3. From the defined concepts, identify the SoI parts essentials for
            your design.
          </label>
          <Button variant="outline" size="sm" onClick={addPartCol}>
            <Plus className="w-4 h-4 mr-2" /> Add Column
          </Button>
        </div>

        <div className="overflow-x-auto border border-gray-200 rounded-lg bg-white">
          <table className="min-w-[700px] w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-bold text-black tracking-wider w-1/4">
                  Concepts
                </th>
                {Array.from({ length: partCols }).map((_, c) => (
                  <th
                    key={c}
                    className="px-3 py-2 text-left text-xs font-bold text-black tracking-wider relative"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span>Part {c + 1}</span>
                      {partCols > 1 && (
                        <button
                          type="button"
                          onClick={() => removePartCol(c)}
                          className="text-red-500 hover:bg-red-50 rounded p-0.5 transition-colors"
                          title={`Remove Part ${c + 1}`}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </th>
                ))}
                <th className="px-3 py-2 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {Array.from({ length: partRows }).map((_, r) => (
                <tr key={r} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-3 py-2">
                    <Input
                      placeholder="Concept"
                      value={getField(`parts-${r}-0`)}
                      onChange={(e) =>
                        updateField(`parts-${r}-0`, e.target.value)
                      }
                      className="h-8 text-xs font-medium"
                    />
                  </td>
                  {Array.from({ length: partCols }).map((_, c) => (
                    <td key={c} className="px-3 py-2">
                      <Input
                        placeholder="Enter the part's name"
                        value={getField(`parts-${r}-${c + 1}`)}
                        onChange={(e) =>
                          updateField(`parts-${r}-${c + 1}`, e.target.value)
                        }
                        className="h-8 text-xs"
                      />
                    </td>
                  ))}
                  <td className="px-2 py-2 text-center">
                    {partRows > 1 && (
                      <button
                        type="button"
                        onClick={() => removePartRow(r)}
                        className="inline-flex items-center justify-center rounded-md p-1 text-red-500 hover:bg-red-50 transition-colors"
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
          onClick={addPartRow}
          className="mt-2"
        >
          <Plus className="w-4 h-4 mr-2" /> Add Row
        </Button>
        <TypingIndicator
          editingUsers={editingUsers}
          fieldName={`${fieldPrefix}-parts-table`}
        />
      </div>
    </div>
  );
}

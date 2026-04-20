// src/pages/substep/substep-content-card/forms/subtask-1-1-a/PrimaryElementsTable.tsx

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import TypingIndicator from "@/components/TypingIndicator";

interface PrimaryElementsTableProps {
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

export default function PrimaryElementsTable({
  formData,
  onFormDataChange,
  fieldPrefix,
  editingUsers = {},
}: PrimaryElementsTableProps) {
  const getRowCount = () => {
    const stored = formData[`${fieldPrefix}-element-row-count`];
    if (stored && typeof stored === "number" && stored >= 1) {
      return stored;
    }

    let maxRow = 2;
    let idx = 0;
    while (true) {
      const name = formData[`${fieldPrefix}-element-${idx}-name`];
      const definition = formData[`${fieldPrefix}-element-${idx}-definition`];
      if (!name && !definition) break;
      maxRow = Math.max(maxRow, idx + 1);
      idx++;
    }
    return maxRow;
  };

  const rowCount = getRowCount();

  const getField = (row: number, field: string) =>
    formData[`${fieldPrefix}-element-${row}-${field}`] || "";

  const updateField = (row: number, field: string, value: any) => {
    onFormDataChange(`${fieldPrefix}-element-${row}-${field}`, value);
  };

  const updateRowCount = (newCount: number) => {
    onFormDataChange(`${fieldPrefix}-element-row-count`, newCount);
  };

  const handleAddRow = () => {
    updateRowCount(rowCount + 1);
  };

  const handleDeleteRow = (index: number) => {
    if (rowCount <= 1) return;

    updateField(index, "name", "");
    updateField(index, "definition", "");

    updateRowCount(rowCount - 1);

    for (let i = index + 1; i < rowCount; i++) {
      const name = getField(i, "name");
      const definition = getField(i, "definition");
      updateField(i - 1, "name", name);
      updateField(i - 1, "definition", definition);
      updateField(i, "name", "");
      updateField(i, "definition", "");
    }
  };

  return (
    <div className="space-y-3">
      <label className="text-sm font-semibold text-gray-800">
        3. Identify the primary elements of the activity created by or
        transformed by the SoI's action
      </label>

      <div className="border border-gray-200 rounded-lg overflow-hidden max-w-2xl">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 border-b border-gray-200">
                Element
              </th>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 border-b border-gray-200">
                Definition
              </th>
              <th className="px-4 py-2 w-10 border-b border-gray-200"></th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rowCount }).map((_, row) => (
              <tr key={row} className="border-b border-gray-100 last:border-0">
                <td className="px-4 py-2">
                  <Input
                    placeholder={`Element ${row + 1}`}
                    value={getField(row, "name")}
                    onChange={(e) => updateField(row, "name", e.target.value)}
                    className="border-0 bg-transparent focus-visible:ring-0 p-0 pl-3"
                  />
                  {/* Display editing indicator */}
                  <TypingIndicator
                    editingUsers={editingUsers}
                    fieldName={`${fieldPrefix}-element-${row}-name`}
                  />
                </td>
                <td className="px-4 py-2">
                  <Input
                    placeholder={`Definition ${row + 1}`}
                    value={getField(row, "definition")}
                    onChange={(e) =>
                      updateField(row, "definition", e.target.value)
                    }
                    className="border-0 bg-transparent focus-visible:ring-0 p-0 pl-3"
                  />
                  <TypingIndicator
                    editingUsers={editingUsers}
                    fieldName={`${fieldPrefix}-element-${row}-definition`}
                  />
                </td>
                <td className="px-2 py-2">
                  {rowCount > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleDeleteRow(row)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
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
        className="mt-2"
        onClick={handleAddRow}
      >
        <Plus className="w-4 h-4 mr-2" />
        Add Row
      </Button>
    </div>
  );
}

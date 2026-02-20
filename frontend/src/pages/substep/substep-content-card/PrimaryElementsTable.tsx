// src/pages/substep/substep-content-card/PrimaryElementsTable.tsx

import { Input } from "@/components/ui/input";

interface PrimaryElementsTableProps {
  formData: Record<string, any>;
  onFormDataChange: (field: string, value: any) => void;
  fieldPrefix: string;
}

export default function PrimaryElementsTable({
  formData,
  onFormDataChange,
  fieldPrefix,
}: PrimaryElementsTableProps) {
  const getField = (field: string) => formData[`${fieldPrefix}-${field}`] || "";
  const updateField = (field: string, value: any) => {
    onFormDataChange(`${fieldPrefix}-${field}`, value);
  };

  return (
    <div className="space-y-2">
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
            </tr>
          </thead>
          <tbody>
            {[0, 1].map((row) => (
              <tr key={row} className="border-b border-gray-100 last:border-0">
                <td className="px-4 py-2">
                  <Input
                    placeholder={`Element ${row + 1}`}
                    value={getField(`element-${row}-name`)}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      updateField(`element-${row}-name`, e.target.value)
                    }
                    className="border-0 bg-transparent focus-visible:ring-0 p-0"
                  />
                </td>
                <td className="px-4 py-2">
                  <Input
                    placeholder={`Definition ${row + 1}`}
                    value={getField(`element-${row}-definition`)}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      updateField(`element-${row}-definition`, e.target.value)
                    }
                    className="border-0 bg-transparent focus-visible:ring-0 p-0"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

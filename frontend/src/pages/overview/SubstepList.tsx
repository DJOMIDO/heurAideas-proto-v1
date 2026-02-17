import { ResizablePanel } from "@/components/ui/resizable";
import { type Substep } from "@/data/steps";

interface SubstepListProps {
  substeps: Substep[];
  selectedId: string | null;
  onSelect: (substep: Substep) => void;
}

export default function SubstepList({
  substeps,
  selectedId,
  onSelect,
}: SubstepListProps) {
  return (
    <ResizablePanel
      defaultSize="25"
      minSize="15"
      maxSize="40"
      className="bg-white"
    >
      <div className="h-full overflow-y-auto p-4">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Substeps
        </h3>
        <div className="space-y-2">
          {substeps.map((substep) => (
            <div
              key={substep.id}
              onClick={() => onSelect(substep)}
              className={`p-3 rounded-lg cursor-pointer transition-all border
                ${
                  selectedId === substep.id
                    ? "bg-blue-50 border-blue-200 text-blue-700 shadow-sm"
                    : "bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300"
                }`}
            >
              <span className="font-medium text-sm">{substep.title}</span>
            </div>
          ))}
        </div>
      </div>
    </ResizablePanel>
  );
}

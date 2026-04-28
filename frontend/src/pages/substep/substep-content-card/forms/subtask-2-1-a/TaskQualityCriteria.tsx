// frontend/src/pages/substep/substep-content-card/forms/subtask-2-1-a/TaskQualityCriteria.tsx

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, GripVertical } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { TaskData, QualityCriteria } from "./types";

function SortableCriterion({
  id,
  value,
  index,
  onChange,
  onRemove,
  canRemove,
}: {
  id: string;
  value: string;
  index: number;
  onChange: (value: string) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className="flex items-center gap-2 group bg-white p-2 rounded-lg border border-gray-200 hover:border-gray-300 transition-all shadow-sm hover:shadow-md"
    >
      <button
        {...listeners}
        className="text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing p-1 shrink-0"
        aria-label="Drag to reorder"
      >
        <GripVertical className="w-4 h-4" />
      </button>

      <span className="text-xs text-gray-500 w-5 shrink-0 font-mono text-center">
        {index + 1}.
      </span>

      <Input
        placeholder="Quality criteria"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 min-w-0 h-8 text-xs bg-transparent border-none focus-visible:ring-0 pl-2 pr-0 placeholder:text-gray-400"
      />

      {canRemove && (
        <button
          onClick={onRemove}
          className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-1 rounded-md transition-colors shrink-0"
          title="Remove criteria"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

interface TaskQualityCriteriaProps {
  task: TaskData;
  updateTask: (updates: Partial<TaskData>) => void;
}

export default function TaskQualityCriteria({
  task,
  updateTask,
}: TaskQualityCriteriaProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = task.qualityCriteria.findIndex((c) => c.id === active.id);
    const newIndex = task.qualityCriteria.findIndex((c) => c.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      const sortedCriteria = arrayMove(
        task.qualityCriteria,
        oldIndex,
        newIndex,
      );
      updateTask({ qualityCriteria: sortedCriteria });
    }
  };

  const addQualityCriteria = () => {
    const newCriteria: QualityCriteria = {
      id: `qc-${Date.now()}`,
      value: "",
    };
    updateTask({ qualityCriteria: [...task.qualityCriteria, newCriteria] });
  };

  const removeQualityCriteria = (id: string) => {
    updateTask({
      qualityCriteria: task.qualityCriteria.filter((c) => c.id !== id),
    });
  };

  const updateQualityCriteria = (id: string, value: string) => {
    updateTask({
      qualityCriteria: task.qualityCriteria.map((c) =>
        c.id === id ? { ...c, value } : c,
      ),
    });
  };

  return (
    <div className="space-y-3">
      <label className="text-sm font-semibold text-gray-800">
        Task quality criteria:
      </label>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <SortableContext
            items={task.qualityCriteria.map((c) => c.id)}
            strategy={verticalListSortingStrategy}
          >
            {task.qualityCriteria.map((qc, idx) => (
              <SortableCriterion
                key={qc.id}
                id={qc.id}
                value={qc.value}
                index={idx}
                onChange={(value) => updateQualityCriteria(qc.id, value)}
                onRemove={() => removeQualityCriteria(qc.id)}
                canRemove={task.qualityCriteria.length > 1}
              />
            ))}
          </SortableContext>

          <Button
            variant="outline"
            size="sm"
            onClick={addQualityCriteria}
            className="col-span-1 sm:col-span-2 h-9 text-xs border-dashed border-gray-300 hover:border-teal-500 hover:text-teal-600 hover:bg-teal-50/50"
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Add new quality criteria
          </Button>
        </div>
      </DndContext>
    </div>
  );
}

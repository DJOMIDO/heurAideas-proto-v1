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
import type { TaskData } from "./types";

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
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className="flex items-center gap-2 group bg-white p-2 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
    >
      <button
        {...listeners}
        className="text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing p-1"
      >
        <GripVertical className="w-4 h-4" />
      </button>
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <span className="text-xs text-gray-500 w-5 shrink-0">{index + 1}.</span>
        <Input
          placeholder="Quality criteria"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 min-w-0 h-8 text-xs"
        />
        {canRemove && (
          <button
            onClick={onRemove}
            className="text-red-500 hover:text-red-700 hover:bg-red-50 shrink-0"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
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
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = task.qualityCriteria.findIndex((c) => c.id === active.id);
    const newIndex = task.qualityCriteria.findIndex((c) => c.id === over.id);
    updateTask({
      qualityCriteria: arrayMove(task.qualityCriteria, oldIndex, newIndex),
    });
  };

  const addQualityCriteria = () => {
    updateTask({
      qualityCriteria: [
        ...task.qualityCriteria,
        { id: `qc${Date.now()}`, value: "" },
      ],
    });
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
    <div className="space-y-2">
      <label className="text-sm font-semibold text-gray-800">
        Task quality criteria:
      </label>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-2 gap-3">
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
            className="h-auto py-2 px-3 text-xs flex items-center justify-center"
          >
            <Plus className="w-3 h-3 mr-1" /> Add new quality criteria
          </Button>
        </div>
      </DndContext>
    </div>
  );
}

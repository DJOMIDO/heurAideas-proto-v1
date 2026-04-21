// frontend/src/pages/substep/substep-content-card/forms/subtask-2-1-a/TaskConstraints.tsx

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import type { TaskData, Constraint, ObservableElement } from "./types";

function SortableConstraint({
  constraint,
  index,
  onUpdate,
  onRemove,
  canRemove,
}: {
  constraint: Constraint;
  index: number;
  onUpdate: (field: keyof Constraint, value: any) => void;
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
  } = useSortable({ id: constraint.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const addObservable = () => {
    const newObservable: ObservableElement = {
      id: `oe${Date.now()}`,
      value: "",
    };
    onUpdate("observables", [...constraint.observables, newObservable]);
  };

  const removeObservable = (oeId: string) => {
    onUpdate(
      "observables",
      constraint.observables.filter((o) => o.id !== oeId),
    );
  };

  const updateObservable = (oeId: string, value: string) => {
    onUpdate(
      "observables",
      constraint.observables.map((o) => (o.id === oeId ? { ...o, value } : o)),
    );
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
    >
      <button
        {...listeners}
        className="text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing p-1 shrink-0"
      >
        <GripVertical className="w-4 h-4" />
      </button>

      <span className="text-xs text-gray-500 w-5 shrink-0">{index + 1}.</span>

      <div className="flex items-center gap-2 flex-[2] min-w-0">
        <Select
          value={constraint.type}
          onValueChange={(v) => onUpdate("type", v)}
        >
          <SelectTrigger className="w-[120px] bg-white h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Physical">Physical</SelectItem>
            <SelectItem value="...">...</SelectItem>
          </SelectContent>
        </Select>
        <Input
          placeholder="Description"
          value={constraint.value}
          onChange={(e) => onUpdate("value", e.target.value)}
          className="flex-1 bg-white h-8 text-xs"
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

      <div className="w-px h-8 bg-gray-300 shrink-0" />

      <div className="flex flex-col gap-1.5 flex-[2] min-w-0 w-full">
        {constraint.observables.map((oe) => (
          <div key={oe.id} className="flex items-center gap-1 w-full">
            <Input
              placeholder="Observable elements"
              value={oe.value}
              onChange={(e) => updateObservable(oe.id, e.target.value)}
              className="flex-1 min-w-[120px] bg-white h-8 text-xs"
            />
            {constraint.observables.length > 1 && (
              <button
                onClick={() => removeObservable(oe.id)}
                className="text-red-500 hover:text-red-700 hover:bg-red-50 shrink-0"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>
        ))}
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={addObservable}
        className="h-8 px-2 text-sm font-bold text-teal-600 hover:text-teal-700 hover:bg-teal-50 shrink-0"
      >
        <Plus className="w-3 h-3 mr-1" /> Add
      </Button>
    </div>
  );
}

interface TaskConstraintsProps {
  task: TaskData;
  updateTask: (updates: Partial<TaskData>) => void;
}

export default function TaskConstraints({
  task,
  updateTask,
}: TaskConstraintsProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = task.constraints.findIndex((c) => c.id === active.id);
    const newIndex = task.constraints.findIndex((c) => c.id === over.id);
    updateTask({
      constraints: arrayMove(task.constraints, oldIndex, newIndex),
    });
  };

  const addConstraint = () => {
    updateTask({
      constraints: [
        ...task.constraints,
        {
          id: `c${Date.now()}`,
          type: "Physical",
          value: "",
          observables: [{ id: `oe${Date.now()}`, value: "" }],
        },
      ],
    });
  };

  const removeConstraint = (id: string) => {
    updateTask({ constraints: task.constraints.filter((c) => c.id !== id) });
  };

  const updateConstraint = (
    id: string,
    field: keyof Constraint,
    value: any,
  ) => {
    updateTask({
      constraints: task.constraints.map((c) =>
        c.id === id ? { ...c, [field]: value } : c,
      ),
    });
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-gray-800">
        Task constraints:
      </label>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={task.constraints.map((c) => c.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {task.constraints.map((constraint, idx) => (
              <SortableConstraint
                key={constraint.id}
                constraint={constraint}
                index={idx}
                onUpdate={(field, value) =>
                  updateConstraint(constraint.id, field, value)
                }
                onRemove={() => removeConstraint(constraint.id)}
                canRemove={task.constraints.length > 1}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
      <Button variant="outline" size="sm" onClick={addConstraint}>
        <Plus className="w-4 h-4 mr-2" /> Add constraints and observables
      </Button>
    </div>
  );
}

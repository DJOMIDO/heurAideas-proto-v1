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
import TypingIndicator from "@/components/TypingIndicator";

function SortableConstraint({
  constraint,
  index,
  onUpdateConstraint,
  onRemoveConstraint,
  canRemove,
  fieldPrefix,
  onFormDataChange,
  editingUsers,
}: {
  constraint: Constraint;
  index: number;
  onUpdateConstraint: (id: string, field: keyof Constraint, value: any) => void;
  onRemoveConstraint: (id: string) => void;
  canRemove: boolean;
  fieldPrefix?: string;
  onFormDataChange?: (field: string, value: any) => void;
  editingUsers?: Record<
    string,
    { userId: number; username: string; timestamp: string }
  >;
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
    zIndex: isDragging ? 10 : 1,
  };

  const addObservable = () => {
    const newObs: ObservableElement = {
      id: `oe-${Date.now()}`,
      value: "",
    };
    onUpdateConstraint(constraint.id, "observables", [
      ...constraint.observables,
      newObs,
    ]);
  };
  const removeObservable = (oeId: string) => {
    onUpdateConstraint(
      constraint.id,
      "observables",
      constraint.observables.filter((o) => o.id !== oeId),
    );
  };
  const updateObservable = (oeId: string, value: string) => {
    onUpdateConstraint(
      constraint.id,
      "observables",
      constraint.observables.map((o) => (o.id === oeId ? { ...o, value } : o)),
    );
  };

  const constraintValueKey = fieldPrefix
    ? `${fieldPrefix}-constraint-${constraint.id}-value`
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className="flex flex-col gap-3 bg-gray-50 p-3 rounded-lg border border-gray-200 hover:border-gray-300 transition-all shadow-sm"
    >
      {/* 第一行：拖拽柄 + 序号 + 类型选择 + 描述输入 + 删除 */}
      <div className="flex items-center gap-2">
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

        <Select
          value={constraint.type}
          onValueChange={(v) => onUpdateConstraint(constraint.id, "type", v)}
        >
          <SelectTrigger className="w-[100px] bg-white h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Physical">Physical</SelectItem>
            <SelectItem value="Cognitive">Cognitive</SelectItem>
            <SelectItem value="Temporal">Temporal</SelectItem>
            <SelectItem value="Spatial">Spatial</SelectItem>
          </SelectContent>
        </Select>

        <Input
          placeholder="Description"
          value={constraint.value}
          onChange={(e) => {
            // 动作 1：触发打字通知
            if (onFormDataChange && constraintValueKey) {
              onFormDataChange(constraintValueKey, e.target.value);
            }
            // 动作 2：更新本地数据
            onUpdateConstraint(constraint.id, "value", e.target.value);
          }}
          className="flex-1 bg-white h-8 text-xs"
        />

        {/* 动作 3：显示输入提示 */}
        {constraintValueKey && (
          <TypingIndicator
            editingUsers={editingUsers}
            fieldName={constraintValueKey}
          />
        )}

        {canRemove && (
          <button
            onClick={() => onRemoveConstraint(constraint.id)}
            className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-1 rounded-md transition-colors shrink-0"
            title="Remove constraint"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* 第二行：Observables 列表 */}
      <div className="pl-8 space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">
            Observables:
          </span>
          <div className="flex-1 border-t border-gray-200" />
        </div>

        <div className="space-y-1.5">
          {constraint.observables.map((oe) => {
            const observableKey = fieldPrefix
              ? `${fieldPrefix}-constraint-${constraint.id}-obs-${oe.id}`
              : undefined;

            return (
              <div key={oe.id} className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-teal-400 shrink-0" />
                <Input
                  placeholder="Observable element"
                  value={oe.value}
                  onChange={(e) => {
                    // 动作 1：触发打字通知
                    if (onFormDataChange && observableKey) {
                      onFormDataChange(observableKey, e.target.value);
                    }
                    // 动作 2：更新本地数据
                    updateObservable(oe.id, e.target.value);
                  }}
                  className="flex-1 bg-white h-7 text-xs border-gray-200 focus-visible:ring-teal-500/20"
                />
                {/* 动作 3：显示输入提示 */}
                {observableKey && (
                  <TypingIndicator
                    editingUsers={editingUsers}
                    fieldName={observableKey}
                  />
                )}
                {constraint.observables.length > 1 && (
                  <button
                    onClick={() => removeObservable(oe.id)}
                    className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-0.5 rounded shrink-0"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={addObservable}
          className="h-6 text-[10px] text-teal-600 hover:text-teal-700 hover:bg-teal-50 px-2 w-auto"
        >
          <Plus className="w-3 h-3 mr-1" /> Add observable
        </Button>
      </div>
    </div>
  );
}

interface TaskConstraintsProps {
  task: TaskData;
  updateTask: (updates: Partial<TaskData>) => void;
  fieldPrefix: string;
  onFormDataChange?: (field: string, value: any) => void;
  editingUsers?: Record<
    string,
    { userId: number; username: string; timestamp: string }
  >;
}

export default function TaskConstraints({
  task,
  updateTask,
  fieldPrefix,
  onFormDataChange,
  editingUsers,
}: TaskConstraintsProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // 处理拖拽结束：重新排序并保存
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = task.constraints.findIndex((c) => c.id === active.id);
    const newIndex = task.constraints.findIndex((c) => c.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      updateTask({
        constraints: arrayMove(task.constraints, oldIndex, newIndex),
      });
    }
  };

  // 添加新约束
  const addConstraint = () => {
    const newConstraint: Constraint = {
      id: `c-${Date.now()}`,
      type: "Physical",
      value: "",
      observables: [{ id: `oe-${Date.now()}`, value: "" }],
    };
    updateTask({ constraints: [...task.constraints, newConstraint] });
  };

  // 删除指定约束
  const removeConstraint = (id: string) => {
    updateTask({
      constraints: task.constraints.filter((c) => c.id !== id),
    });
  };

  // 更新指定约束字段
  const updateConstraintField = (
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
    <div className="space-y-3">
      <label className="text-sm font-semibold text-gray-800">
        Task constraints:
      </label>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <div className="space-y-3">
          <SortableContext
            items={task.constraints.map((c) => c.id)}
            strategy={verticalListSortingStrategy}
          >
            {task.constraints.map((constraint, idx) => (
              <SortableConstraint
                key={constraint.id}
                constraint={constraint}
                index={idx}
                onUpdateConstraint={updateConstraintField}
                onRemoveConstraint={removeConstraint}
                canRemove={task.constraints.length > 1}
                fieldPrefix={fieldPrefix}
                onFormDataChange={onFormDataChange}
                editingUsers={editingUsers}
              />
            ))}
          </SortableContext>

          <Button
            variant="outline"
            size="sm"
            onClick={addConstraint}
            className="w-full h-9 text-xs border-dashed border-gray-300 hover:border-teal-500 hover:text-teal-600 hover:bg-teal-50/50"
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Add constraints and observables
          </Button>
        </div>
      </DndContext>
    </div>
  );
}

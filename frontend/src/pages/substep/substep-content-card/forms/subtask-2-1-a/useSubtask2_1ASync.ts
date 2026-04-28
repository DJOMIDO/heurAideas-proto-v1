// frontend/src/pages/substep/substep-content-card/forms/subtask-2-1-a/useSubtask2_1ASync.ts

import { useState, useEffect, useCallback, useRef } from "react";
import { getSubstepContent, saveSubstepContent } from "@/api/projects";
import type {
  TaskData,
  SubtaskData,
  Subtask2_1AContent,
  QualityCriteria,
  Constraint,
} from "./types";

interface UseSubtask2_1ASyncProps {
  projectId: number;
  substepId: string;
  userId: number;
  initialTasks?: TaskData[];
}

export function useSubtask2_1ASync({
  projectId,
  substepId,
  userId,
  initialTasks = [],
}: UseSubtask2_1ASyncProps) {
  const [tasks, setTasks] = useState<TaskData[]>(initialTasks);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [version, setVersion] = useState(1);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 清理子任务：只保留有实际内容的 Subtask
  const deepCleanSubtasks = useCallback(
    (subtasks: SubtaskData[]): SubtaskData[] => {
      return subtasks
        .filter(
          (st) =>
            st?.name?.trim() ||
            st?.selectedCriteria?.length ||
            st?.selectedStakeholders?.length ||
            st?.selectedConstraints?.length,
        )
        .map((st) => ({
          id: st.id,
          name: st.name?.trim() || "",
          state: st.state || "State",
          isExpanded: st.isExpanded !== undefined ? st.isExpanded : true,
          selectedCriteria: st.selectedCriteria || [],
          selectedStakeholders: st.selectedStakeholders || [],
          selectedConstraints: st.selectedConstraints || [],
        }));
    },
    [],
  );

  // 清理任务：只保留有实际内容的 Task（末尾添加 .filter()）
  const deepCleanTasks = useCallback(
    (tasks: TaskData[]): TaskData[] => {
      return (
        tasks
          .map((task) => {
            // 清理 qualityCriteria
            const cleanQC: QualityCriteria[] = (task.qualityCriteria || [])
              .filter((qc) => qc?.value?.trim())
              .map((qc) => ({ id: qc.id, value: qc.value.trim() }));

            // 清理 constraints
            const cleanConstraints: Constraint[] = (task.constraints || [])
              .filter((c) => c?.value?.trim())
              .map((c) => ({
                ...c,
                value: c.value.trim(),
                observables: (c.observables || [])
                  .filter((oe) => oe?.value?.trim())
                  .map((oe) => ({ id: oe.id, value: oe.value.trim() })),
              }))
              .filter((c) => c.observables.length > 0);

            // 递归清理 subtasks
            const cleanSubtasks: SubtaskData[] = deepCleanSubtasks(
              task.subtasks || [],
            );

            // 构建干净对象（保留 isExpanded UI 状态）
            const result: Record<string, any> = {
              id: task.id,
              name: task.name?.trim() || "",
              state: task.state || "State",
              objective: task.objective?.trim() || "",
              isExpanded:
                task.isExpanded !== undefined ? task.isExpanded : true,
            };

            if (cleanQC.length > 0) result.qualityCriteria = cleanQC;
            if (cleanConstraints.length > 0)
              result.constraints = cleanConstraints;
            if (cleanSubtasks.length > 0) result.subtasks = cleanSubtasks;

            return result as TaskData;
          })
          // 过滤掉"完全空的任务"（只有默认值，无实际内容）
          .filter((task) => {
            const hasRealContent =
              task.name?.trim() ||
              task.objective?.trim() ||
              task.qualityCriteria?.length ||
              task.constraints?.length ||
              task.subtasks?.length;
            return !!hasRealContent;
          })
      );
    },
    [deepCleanSubtasks],
  );

  // 1. 初始化加载
  useEffect(() => {
    if (!projectId || !substepId) return;

    const loadContent = async () => {
      try {
        const res = await getSubstepContent(projectId, substepId);

        if (res?.content_data?.tasks && Array.isArray(res.content_data.tasks)) {
          const normalizedTasks: TaskData[] = res.content_data.tasks.map(
            (task: any) => ({
              id: task.id || "",
              name: task.name || "",
              state: task.state || "State",
              objective: task.objective || "",
              isExpanded:
                task.isExpanded !== undefined ? task.isExpanded : true,
              subtasks: task.subtasks || [],
              qualityCriteria: task.qualityCriteria || [],
              constraints: task.constraints || [],
            }),
          );

          setTasks(normalizedTasks);
          setVersion(res.content_data.version || 1);
          setLastSavedAt(res.updated_at || null);
        } else {
          setTasks([]);
        }
      } catch (err) {
        console.warn(`[2.1.A] Failed to load content:`, err);
        setTasks([]);
      }
    };

    loadContent();
  }, [projectId, substepId]);

  // 2. 防抖自动保存
  const triggerSave = useCallback(
    async (tasksToSave: TaskData[]) => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }

      setIsSaving(true);

      saveTimerRef.current = setTimeout(async () => {
        try {
          const cleanedTasks = deepCleanTasks(tasksToSave);

          const payload: Subtask2_1AContent = {
            version: version + 1,
            tasks: cleanedTasks,
            metadata: {
              lastSavedBy: userId,
              lastSavedAt: new Date().toISOString(),
            },
          };

          await saveSubstepContent(projectId, substepId, {
            content_data: payload,
            ui_state: {},
          });

          setVersion(payload.version);
          setLastSavedAt(new Date().toISOString());
          setIsSaving(false);
        } catch (err) {
          console.error(`[2.1.A] Auto-save failed:`, err);
          setIsSaving(false);
        }
      }, 800);
    },
    [projectId, substepId, userId, version, deepCleanTasks],
  );

  // 3. 更新单个 Task
  const updateTask = useCallback(
    (taskId: string, updates: Partial<TaskData>) => {
      setTasks((prev) => {
        const next = prev.map((task) =>
          task.id === taskId ? { ...task, ...updates } : task,
        );
        triggerSave(next);
        return next;
      });
    },
    [triggerSave],
  );

  // 4. 添加新 Task
  const addTask = useCallback(
    (newTask: TaskData) => {
      setTasks((prev) => {
        const next = [...prev, newTask];
        triggerSave(next);
        return next;
      });
    },
    [triggerSave],
  );

  // 5. 删除 Task
  const removeTask = useCallback(
    (taskId: string) => {
      setTasks((prev) => {
        const next = prev.filter((task) => task.id !== taskId);
        triggerSave(next);
        return next;
      });
    },
    [triggerSave],
  );

  // 6. 清理定时器
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, []);

  return {
    tasks,
    isSaving,
    lastSavedAt,
    version,
    updateTask,
    addTask,
    removeTask,
    setTasks,
    forceSave: () => triggerSave(tasks),
  };
}

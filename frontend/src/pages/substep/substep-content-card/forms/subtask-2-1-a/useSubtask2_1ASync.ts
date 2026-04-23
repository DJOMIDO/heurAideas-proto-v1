// frontend/src/pages/substep/substep-content-card/forms/subtask-2-1-a/useSubtask2_1ASync.ts

import { useState, useEffect, useCallback, useRef } from "react";
import { getSubstepContent, saveSubstepContent } from "@/api/projects";
import type { TaskData, Subtask2_1AContent } from "./types";

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

  // 1. 初始化加载
  useEffect(() => {
    if (!projectId || !substepId) return;

    const loadContent = async () => {
      try {
        const res = await getSubstepContent(projectId, substepId);

        if (res?.content_data?.tasks && Array.isArray(res.content_data.tasks)) {
          // 确保每个 task 的嵌套数组字段都有默认值
          const normalizedTasks = res.content_data.tasks.map((task: any) => ({
            ...task,
            // 确保所有数组字段都有默认值
            subtasks: task.subtasks || [],
            qualityCriteria: task.qualityCriteria || [],
            constraints: task.constraints || [],
            // 确保布尔字段有默认值
            isExpanded: task.isExpanded !== undefined ? task.isExpanded : true,
            // 确保字符串字段有默认值
            name: task.name || "",
            state: task.state || "State",
            objective: task.objective || "",
          }));

          setTasks(normalizedTasks);
          setVersion(res.content_data.version || 1);
          setLastSavedAt(res.updated_at || null);
        } else {
          // 如果没有数据，使用空数组
          setTasks([]);
        }
      } catch (err) {
        console.warn(`[2.1.A] Failed to load content:`, err);
        // 出错时使用空数组
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
          const payload: Subtask2_1AContent = {
            version: version + 1,
            tasks: tasksToSave,
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
    [projectId, substepId, userId, version],
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

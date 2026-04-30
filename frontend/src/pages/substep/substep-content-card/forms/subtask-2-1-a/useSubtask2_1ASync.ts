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
  sendMessage?: (message: any) => void;
  userInfo?: { name: string };
  syncKey?: number;
}

export function useSubtask2_1ASync({
  projectId,
  substepId,
  userId,
  initialTasks = [],
  sendMessage,
  userInfo,
  syncKey = 0,
}: UseSubtask2_1ASyncProps) {
  const [tasks, setTasks] = useState<TaskData[]>(initialTasks);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [version, setVersion] = useState(1);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 清理子任务：保留结构，仅修剪首尾空格（停止过滤空 Subtask）
  const deepCleanSubtasks = useCallback(
    (subtasks: SubtaskData[]): SubtaskData[] => {
      return subtasks.map((st) => ({
        id: st.id,
        name: st.name?.trim() ?? "",
        state: st.state || "State",
        isExpanded: st.isExpanded !== undefined ? st.isExpanded : true,
        selectedCriteria: st.selectedCriteria || [],
        selectedStakeholders: st.selectedStakeholders || [],
        selectedConstraints: st.selectedConstraints || [],
      }));
    },
    [],
  );

  // 停止过滤空字段，完整保留 UI 结构
  const deepCleanTasks = useCallback(
    (tasks: TaskData[]): TaskData[] => {
      return tasks.map((task) => {
        // 仅修剪字符串，不删除空值项
        const cleanQC: QualityCriteria[] = (task.qualityCriteria || []).map(
          (qc) => ({
            id: qc.id,
            value: qc.value?.trim() ?? "",
          }),
        );

        const cleanConstraints: Constraint[] = (task.constraints || []).map(
          (c) => ({
            ...c,
            value: c.value?.trim() ?? "",
            observables: (c.observables || []).map((oe) => ({
              id: oe.id,
              value: oe.value?.trim() ?? "",
            })),
          }),
        );

        const cleanSubtasks: SubtaskData[] = deepCleanSubtasks(
          task.subtasks || [],
        );

        return {
          id: task.id,
          name: task.name?.trim() ?? "",
          state: task.state || "State",
          objective: task.objective?.trim() ?? "",
          isExpanded: task.isExpanded !== undefined ? task.isExpanded : true,
          qualityCriteria: cleanQC,
          constraints: cleanConstraints,
          subtasks: cleanSubtasks,
        } as TaskData;
      });
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

  // 监听 syncKey 变化，自动拉取最新数据
  useEffect(() => {
    if (syncKey > 0) {
      const loadRemote = async () => {
        try {
          const res = await getSubstepContent(projectId, substepId);
          if (
            res?.content_data?.tasks &&
            Array.isArray(res.content_data.tasks)
          ) {
            setTasks(
              res.content_data.tasks.map((task: any) => ({
                id: task.id || "",
                name: task.name || "",
                state: task.state || "State",
                objective: task.objective || "",
                isExpanded:
                  task.isExpanded !== undefined ? task.isExpanded : true,
                subtasks: task.subtasks || [],
                qualityCriteria: task.qualityCriteria || [],
                constraints: task.constraints || [],
              })),
            );
            setVersion(res.content_data.version || 1);
            setLastSavedAt(res.updated_at || null);
          }
        } catch (err) {
          console.warn(`[2.1.A] Remote sync failed:`, err);
        }
      };
      loadRemote();
    }
  }, [syncKey, projectId, substepId]);

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
          const savedAt = new Date().toISOString();
          setLastSavedAt(savedAt);
          setIsSaving(false);

          // 保存成功后，发送 WebSocket 消息通知其他成员
          if (sendMessage) {
            sendMessage({
              type: "content_saved",
              project_id: projectId,
              substep_id: substepId,
              user_id: userId,
              username: userInfo?.name || "User",
              timestamp: savedAt,
            });
          }
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

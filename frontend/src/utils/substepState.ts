// frontend/src/utils/substepState.ts

import { saveSubstepContent, getSubstepContent } from "@/api/projects";
import { isAuthenticated, getUserId } from "./auth";

export interface SubstepState {
  activeTab: string;
  formData: Record<string, any>;
  lastSaved?: string;
  viewMode?: "single" | "split";
  splitView?: {
    leftTab: string;
    rightTab: string;
  };
}

const STORAGE_PREFIX = "substep-state-";

// ✅ 添加调试日志
function getStorageKey(projectId: number, substepId: string): string {
  const userId = getUserId();
  const key = userId
    ? `${STORAGE_PREFIX}${userId}-${projectId}-${substepId}`
    : `${STORAGE_PREFIX}${projectId}-${substepId}`;
  console.log(
    `[getStorageKey] userId=${userId}, projectId=${projectId}, substepId=${substepId} → ${key}`,
  );
  return key;
}

// 保存最后编辑的 substep 信息
export function saveLastEditedSubstep(
  projectId: number,
  stepId: number,
  substepId: string,
): void {
  const userId = getUserId();
  const key = userId
    ? `last-edited-${userId}-${projectId}`
    : `last-edited-${projectId}`;
  const data = {
    stepId,
    substepId,
    timestamp: new Date().toISOString(),
  };
  localStorage.setItem(key, JSON.stringify(data));
  console.log(
    `[saveLastEditedSubstep] userId=${userId}, projectId=${projectId} → ${key}`,
    data,
  );
}

// 获取最后编辑的 substep 信息
export function getLastEditedSubstep(projectId: number): {
  stepId: number;
  substepId: string;
} | null {
  const userId = getUserId();
  const key = userId
    ? `last-edited-${userId}-${projectId}`
    : `last-edited-${projectId}`;
  const data = localStorage.getItem(key);
  console.log(
    `[getLastEditedSubstep] userId=${userId}, projectId=${projectId} → ${key}, found=${!!data}`,
  );

  if (!data) {
    return null;
  }

  try {
    const parsed = JSON.parse(data);
    const lastEdit = new Date(parsed.timestamp);
    const now = new Date();
    const diffDays =
      (now.getTime() - lastEdit.getTime()) / (1000 * 60 * 60 * 24);

    if (diffDays > 7) {
      localStorage.removeItem(key);
      return null;
    }

    return {
      stepId: parsed.stepId,
      substepId: parsed.substepId,
    };
  } catch {
    return null;
  }
}

// 清除最后编辑的 substep 信息
export function clearLastEditedSubstep(projectId: number): void {
  const userId = getUserId();
  const key = userId
    ? `last-edited-${userId}-${projectId}`
    : `last-edited-${projectId}`;
  localStorage.removeItem(key);
}

function convertToContentData(
  formData: Record<string, any>,
): Record<string, any> {
  const contentData: Record<string, any> = {};

  Object.keys(formData).forEach((key) => {
    const match = key.match(/^subtask-([^-]+)-(.+)$/);
    if (match) {
      const [, subtaskId, fieldName] = match;
      const subtaskKey = `subtask-${subtaskId}`;

      if (!contentData[subtaskKey]) {
        contentData[subtaskKey] = {};
      }

      if (fieldName.startsWith("element-")) {
        const elemMatch = fieldName.match(/^element-(\d+)-(.+)$/);
        if (elemMatch) {
          const [, rowIdx, field] = elemMatch;
          if (!contentData[subtaskKey].primaryElements) {
            contentData[subtaskKey].primaryElements = [];
          }
          if (!contentData[subtaskKey].primaryElements[rowIdx]) {
            contentData[subtaskKey].primaryElements[rowIdx] = {};
          }
          contentData[subtaskKey].primaryElements[rowIdx][
            field === "name" ? "element" : field
          ] = formData[key];
          return;
        }
      }

      if (fieldName.startsWith("stakeholder-role-")) {
        const roleIdx = parseInt(fieldName.replace("stakeholder-role-", ""));
        if (!contentData[subtaskKey].stakeholderRoles) {
          contentData[subtaskKey].stakeholderRoles = [];
        }
        contentData[subtaskKey].stakeholderRoles[roleIdx] = formData[key];
        return;
      }

      contentData[subtaskKey][fieldName] = formData[key];
    }
  });

  return contentData;
}

function convertToFormData(
  contentData: Record<string, any>,
): Record<string, any> {
  const formData: Record<string, any> = {};

  Object.entries(contentData).forEach(([subtaskKey, fields]: [string, any]) => {
    const subtaskId = subtaskKey.replace("subtask-", "");

    Object.entries(fields).forEach(([fieldName, value]: [string, any]) => {
      if (fieldName === "primaryElements" && Array.isArray(value)) {
        value.forEach((elem: any, idx: number) => {
          if (elem.element) {
            formData[`subtask-${subtaskId}-element-${idx}-name`] = elem.element;
          }
          if (elem.definition) {
            formData[`subtask-${subtaskId}-element-${idx}-definition`] =
              elem.definition;
          }
        });
        return;
      }

      if (fieldName === "stakeholderRoles" && Array.isArray(value)) {
        value.forEach((role: string, idx: number) => {
          formData[`subtask-${subtaskId}-stakeholder-role-${idx}`] = role;
        });
        return;
      }

      formData[`subtask-${subtaskId}-${fieldName}`] = value;
    });
  });

  return formData;
}

export async function saveSubstepStateWithApi(
  projectId: number,
  substepId: string,
  state: Partial<SubstepState>,
  syncToDatabase: boolean = false,
): Promise<void> {
  const contentData = convertToContentData(state.formData || {});
  const uiState = {
    activeTab: state.activeTab || "description",
    viewMode: state.viewMode || "single",
    splitView: state.splitView,
    lastSaved: new Date().toISOString(),
  };

  if (
    syncToDatabase &&
    import.meta.env.VITE_AUTH_MODE === "real" &&
    isAuthenticated()
  ) {
    try {
      await saveSubstepContent(projectId, substepId, {
        content_data: contentData,
        ui_state: uiState,
      });
      console.log(
        `[saveSubstepStateWithApi] Saved to API: projectId=${projectId}, substepId=${substepId}`,
      );
    } catch (error) {
      console.warn(
        `[saveSubstepStateWithApi] Failed to save to API, falling back to localStorage:`,
        error,
      );
    }
  }

  saveSubstepState(projectId, substepId, state);
  console.log(
    `[saveSubstepStateWithApi] Saved to localStorage: projectId=${projectId}, substepId=${substepId}`,
  );
}

export async function loadSubstepStateWithApi(
  projectId: number,
  substepId: string,
): Promise<SubstepState | null> {
  console.log(
    `[loadSubstepStateWithApi] Loading: projectId=${projectId}, substepId=${substepId}`,
  );

  if (import.meta.env.VITE_AUTH_MODE === "real" && isAuthenticated()) {
    try {
      const apiContent = await getSubstepContent(projectId, substepId);
      if (apiContent && apiContent.content_data) {
        const formData = convertToFormData(apiContent.content_data);
        const state: SubstepState = {
          activeTab: apiContent.ui_state?.activeTab || "description",
          formData,
          lastSaved: apiContent.updated_at || undefined,
          viewMode: apiContent.ui_state?.viewMode || "single",
          splitView: apiContent.ui_state?.splitView,
        };
        console.log(
          `[loadSubstepStateWithApi] Loaded from API: projectId=${projectId}, substepId=${substepId}`,
        );
        return state;
      }
    } catch (error) {
      console.warn(
        `[loadSubstepStateWithApi] Failed to load from API, falling back to localStorage:`,
        error,
      );
    }
  }

  const localState = getSubstepState(projectId, substepId);
  if (localState) {
    console.log(
      `[loadSubstepStateWithApi] Loaded from localStorage: projectId=${projectId}, substepId=${substepId}`,
    );
    return localState;
  }

  console.log(
    `[loadSubstepStateWithApi] No saved state found, returning default`,
  );
  return {
    activeTab: "description",
    formData: {},
    viewMode: "single",
    splitView: { leftTab: "", rightTab: "" },
  };
}

export function getSubstepState(
  projectId: number,
  substepId: string,
): SubstepState | null {
  const key = getStorageKey(projectId, substepId);
  const data = localStorage.getItem(key);
  console.log(`[getSubstepState] key=${key}, found=${!!data}`);

  if (!data) return null;

  try {
    const parsed = JSON.parse(data);
    return {
      activeTab: parsed.activeTab ?? "description",
      formData: parsed.formData ?? {},
      lastSaved: parsed.lastSaved,
      viewMode: parsed.viewMode,
      splitView: parsed.splitView,
    };
  } catch (error) {
    console.warn(`Failed to parse substep state for ${substepId}:`, error);
    return null;
  }
}

export function saveSubstepState(
  projectId: number,
  substepId: string,
  state: Partial<SubstepState>,
): void {
  const existing = getSubstepState(projectId, substepId) || {
    activeTab: "description",
    formData: {},
  };

  const merged = {
    ...existing,
    ...state,
    lastSaved: new Date().toISOString(),
  };

  try {
    const key = getStorageKey(projectId, substepId);
    localStorage.setItem(key, JSON.stringify(merged));
    console.log(`[saveSubstepState] Saved: key=${key}`);
  } catch (error) {
    console.warn(`Failed to save substep state for ${substepId}:`, error);
  }
}

export function clearSubstepState(projectId: number, substepId: string): void {
  const key = getStorageKey(projectId, substepId);
  localStorage.removeItem(key);
}

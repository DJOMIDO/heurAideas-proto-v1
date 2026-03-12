// frontend/src/utils/substepState.ts

import { saveSubstepContent, getSubstepContent } from "@/api/projects";
import { isAuthenticated, getUserId } from "./auth";
import { cleanupEmptyFormDataFields } from "@/utils/formDataUtils";

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

function getStorageKey(projectId: number, substepId: string): string {
  const userId = getUserId();
  const key = userId
    ? `${STORAGE_PREFIX}${userId}-${projectId}-${substepId}`
    : `${STORAGE_PREFIX}${projectId}-${substepId}`;
  return key;
}

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
}

export function getLastEditedSubstep(projectId: number): {
  stepId: number;
  substepId: string;
} | null {
  const userId = getUserId();
  const key = userId
    ? `last-edited-${userId}-${projectId}`
    : `last-edited-${projectId}`;
  const data = localStorage.getItem(key);

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

      if (fieldName === "element-row-count") {
        return;
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
        contentData[subtaskKey][fieldName] = formData[key];
        return;
      }

      contentData[subtaskKey][fieldName] = formData[key];
    }
  });

  Object.keys(contentData).forEach((key) => {
    if (
      typeof contentData[key] === "object" &&
      Object.keys(contentData[key]).length === 0
    ) {
      delete contentData[key];
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

      if (fieldName.startsWith("stakeholder-role-")) {
        formData[`subtask-${subtaskId}-${fieldName}`] = value;
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
  const cleanedFormData = cleanupEmptyFormDataFields(state.formData || {});

  const contentData = convertToContentData(cleanedFormData);
  const uiState = {
    activeTab: state.activeTab || "description",
    viewMode: state.viewMode || "single",
    splitView: state.splitView,
    lastSaved: new Date().toISOString(),
  };

  if (syncToDatabase && isAuthenticated()) {
    try {
      await saveSubstepContent(projectId, substepId, {
        content_data: contentData,
        ui_state: uiState,
      });
    } catch (error) {
      console.warn(
        `[saveSubstepStateWithApi] Failed to save to API, falling back to localStorage:`,
        error,
      );
    }
  }

  saveSubstepState(projectId, substepId, {
    ...state,
    activeTab: state.activeTab || "description",
    formData: cleanedFormData,
  });
}

export async function loadSubstepStateWithApi(
  projectId: number,
  substepId: string,
): Promise<SubstepState | null> {
  const localState = getSubstepState(projectId, substepId);

  // ✅ 修复：只要有 localStorage 状态就加载（不管 formData 是否为空）
  if (localState) {
    console.log(
      `[substepState] Using localStorage state for ${substepId}`,
      localState,
    );
    return localState;
  }

  if (isAuthenticated()) {
    try {
      const apiContent = await getSubstepContent(projectId, substepId);
      if (apiContent) {
        console.log(`[substepState] Using API state for ${substepId}`);
        const formData = apiContent.content_data
          ? convertToFormData(apiContent.content_data)
          : {};
        const state: SubstepState = {
          activeTab: apiContent.ui_state?.activeTab || "description",
          formData,
          lastSaved: apiContent.updated_at || undefined,
          viewMode: apiContent.ui_state?.viewMode || "single",
          splitView: apiContent.ui_state?.splitView,
        };
        return state;
      }
    } catch (error) {
      console.warn(`[loadSubstepStateWithApi] Failed to load from API:`, error);
    }
  }

  // 默认状态
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

  if (!data) return null;

  try {
    const parsed = JSON.parse(data);
    return {
      activeTab: parsed.activeTab || "description", // ✅ 确保有默认值
      formData: parsed.formData ?? {},
      lastSaved: parsed.lastSaved,
      viewMode: parsed.viewMode || "single",
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
  const existing = getSubstepState(projectId, substepId);

  // ✅ 确保 activeTab 始终被保存
  const merged: SubstepState = {
    activeTab: state.activeTab || existing?.activeTab || "description",
    formData:
      state.formData !== undefined ? state.formData : existing?.formData || {},
    lastSaved: new Date().toISOString(),
    viewMode: state.viewMode || existing?.viewMode || "single",
    splitView:
      state.splitView !== undefined ? state.splitView : existing?.splitView,
  };

  try {
    const key = getStorageKey(projectId, substepId);
    localStorage.setItem(key, JSON.stringify(merged));
    console.log(`[substepState] Saved state for ${substepId}:`, merged);
  } catch (error) {
    console.warn(`Failed to save substep state for ${substepId}:`, error);
  }
}

export function clearSubstepState(projectId: number, substepId: string): void {
  const key = getStorageKey(projectId, substepId);
  localStorage.removeItem(key);
}

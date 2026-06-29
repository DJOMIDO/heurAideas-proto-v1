// frontend/src/utils/project.ts

import { getUserId } from "./auth";

export const getCurrentProjectStorageKey = (): string => {
  const userId = getUserId();
  return userId ? `currentProjectId-${userId}` : "currentProjectId";
};

export const getCurrentProjectId = (): number | null => {
  const key = getCurrentProjectStorageKey();
  const stored = localStorage.getItem(key);
  return stored ? Number(stored) : null;
};

export const setCurrentProjectId = (projectId: number): void => {
  const key = getCurrentProjectStorageKey();
  localStorage.setItem(key, String(projectId));
};

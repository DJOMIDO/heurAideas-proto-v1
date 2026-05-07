// frontend/src/utils/project.ts

import { getUserId } from "./auth";

// 生成当前用户的项目 ID 存储 Key
export const getCurrentProjectStorageKey = (): string => {
  const userId = getUserId();
  return userId ? `currentProjectId-${userId}` : "currentProjectId";
};

// 安全获取当前项目 ID
export const getCurrentProjectId = (): number | null => {
  const key = getCurrentProjectStorageKey();
  const stored = localStorage.getItem(key);
  return stored ? Number(stored) : null;
};

// 保存项目 ID 到 localStorage（供后续路由跳转复用）
export const setCurrentProjectId = (projectId: number): void => {
  const key = getCurrentProjectStorageKey();
  localStorage.setItem(key, String(projectId));
};

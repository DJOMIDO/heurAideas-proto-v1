// frontend/src/api/config.ts

export const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000";

export const API_ENDPOINTS = {
  PROJECTS: "/projects",
  PROJECT_DETAIL: (id: number) => `/projects/${id}`,
  SUBSTEP_CONTENT: (projectId: number, substepId: string) =>
    `/projects/${projectId}/substeps/${substepId}/content`,
} as const;

// frontend/src/api/config.ts

export const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000";

export const API_ENDPOINTS = {
  // Projects
  PROJECTS: "/projects",
  PROJECT_DETAIL: (id: number) => `/projects/${id}`,
  SUBSTEP_CONTENT: (projectId: number, substepId: string) =>
    `/projects/${projectId}/substeps/${substepId}/content`,

  // Comments
  COMMENTS: "/comments",
  COMMENTS_BY_PROJECT: (projectId: number) => `/comments/project/${projectId}`,
  COMMENTS_BY_SUBSTEP: (substepId: string) => `/comments/substep/${substepId}`,
  COMMENT_DETAIL: (commentId: number) => `/comments/${commentId}`,
  COMMENT_RESOLVE: (commentId: number) => `/comments/${commentId}/resolve`,
  COMMENT_UNRESOLVE: (commentId: number) => `/comments/${commentId}/unresolve`,
  COMMENT_COUNT: (projectId: number) => `/comments/project/${projectId}/count`,
} as const;

// frontend/src/api/config.ts

// 使用现有的环境变量名
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// 认证模式（预留：未来支持 mock/real 切换）
export const AUTH_MODE = import.meta.env.VITE_AUTH_MODE || 'real';

export const API_ENDPOINTS = {
  // 项目
  PROJECTS: '/projects',
  PROJECT_DETAIL: (id: number) => `/projects/${id}`,
  
  // 子步骤内容
  SUBSTEP_CONTENT: (projectId: number, substepId: string) => 
    `/projects/${projectId}/substeps/${substepId}/content`,
} as const;
// frontend/src/types/project.ts

/**
 * 项目基本信息（列表项）
 */
export interface ProjectList {
  id: number;
  name: string;
  status: string;
  created_at: string;
}

/**
 * 项目完整信息
 */
export interface Project {
  id: number;
  name: string;
  description: string | null;
  creator_id: number;
  template_id: number | null;
  status: string;
  created_at: string;
  updated_at: string | null;
}

/**
 * 子任务
 */
export interface ProjectSubtask {
  id: number;
  code: string;
  title: string;
  order: number;
}

/**
 * 子步骤（包含子任务列表）
 */
export interface ProjectSubstep {
  id: number;
  code: string;
  title: string;
  description: string | null;
  status: string;
  order: number;
  subtasks: ProjectSubtask[];
}

/**
 * 步骤（包含子步骤列表）
 */
export interface ProjectStep {
  id: number;
  code: string;
  title: string;
  description: string | null;
  status: string;
  order: number;
  substeps: ProjectSubstep[];
}

/**
 * 项目详情（包含完整步骤树）
 */
export interface ProjectDetail {
  id: number;
  name: string;
  description: string | null;
  status: string;
  creator_id: number;
  template_id: number | null;
  created_at: string;
  updated_at: string | null;
  steps: ProjectStep[];
}

/**
 * 子步骤内容（从后端获取）
 */
export interface SubstepContent {
  id: number;
  project_substep_id: number;
  content_data: Record<string, any> | null;
  ui_state: Record<string, any> | null;
  updated_at: string | null;
}

/**
 * 创建/更新子步骤内容的输入
 */
export interface SubstepContentCreate {
  content_data: Record<string, any> | null;
  ui_state: Record<string, any> | null;
}

/**
 * 创建项目的输入
 */
export interface CreateProjectInput {
  name: string;
  description?: string;
  template_id?: number;
}

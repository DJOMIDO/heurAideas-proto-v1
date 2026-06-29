// frontend/src/types/project.ts

export interface ProjectList {
  id: number;
  name: string;
  status: string;
  created_at: string;
}

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

export interface ProjectSubtask {
  id: number;
  code: string;
  title: string;
  order: number;
}

export interface ProjectSubstep {
  id: number;
  code: string;
  title: string;
  description: string | null;
  status: string;
  order: number;
  subtasks: ProjectSubtask[];
}

export interface ProjectStep {
  id: number;
  code: string;
  title: string;
  description: string | null;
  status: string;
  order: number;
  substeps: ProjectSubstep[];
}

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

export interface SubstepContent {
  id: number;
  project_substep_id: number;
  content_data: Record<string, any> | null;
  ui_state: Record<string, any> | null;
  updated_at: string | null;
}

export interface SubstepContentCreate {
  content_data: Record<string, any> | null;
  ui_state: Record<string, any> | null;
}

export interface CreateProjectInput {
  name: string;
  description?: string;
  template_id?: number;
  visibility?: string;
}

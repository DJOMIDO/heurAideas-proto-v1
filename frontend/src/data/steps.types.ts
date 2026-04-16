// frontend/src/data/steps.types.ts

export interface Subtask {
  id: string;
  title: string;
  description: string;
  objective?: string;
  actions?: string;
  recommendedDocumentation?: string;
  status?: "todo" | "in-progress" | "completed";
  formType?: string;
}

export interface Substep {
  id: string;
  title: string;
  description?: string;
  status?: "todo" | "in-progress" | "completed";
  subtasks?: Subtask[];
}

export interface Step {
  id: number;
  title: string;
  description: string;
  status?: "todo" | "in-progress" | "completed";
  substeps: Substep[];
}

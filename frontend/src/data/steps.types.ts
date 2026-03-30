export interface Subtask {
  id: string;
  title: string;
  description: string;
  objective?: string;
  actions?: string;
  recommendedDocumentation?: string;
  status?: "todo" | "in-progress" | "completed";
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

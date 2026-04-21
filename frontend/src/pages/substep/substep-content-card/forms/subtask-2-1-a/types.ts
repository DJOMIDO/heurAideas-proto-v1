// frontend/src/pages/substep/substep-content-card/forms/subtask-2-1-a/types.ts

export interface QualityCriteria {
  id: string;
  value: string;
}

export interface ObservableElement {
  id: string;
  value: string;
}

export interface Constraint {
  id: string;
  type: string;
  value: string;
  observables: ObservableElement[];
}

export interface Stakeholder {
  id: string;
  name: string;
  role: string;
  color: string;
}

export interface SubtaskData {
  id: string;
  name: string;
  state: string;
  isExpanded: boolean;
  selectedCriteria: string[];
  selectedStakeholders: string[];
  selectedConstraints: string[];
}

export interface TaskData {
  id: string;
  name: string;
  state: string;
  objective: string;
  qualityCriteria: QualityCriteria[];
  constraints: Constraint[];
  subtasks: SubtaskData[];
  isExpanded: boolean;
}

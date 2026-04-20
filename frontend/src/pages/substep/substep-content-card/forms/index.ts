// frontend/src/pages/substep/substep-content-card/forms/index.ts

import Subtask1_1_A from "./Subtask1_1_A";
import Subtask1_1_B from "./Subtask1_1_B";
import Subtask1_1_C from "./Subtask1_1_C";
import Subtask1_2_A from "./Subtask1_2_A";
import Subtask1_3_A from "./Subtask1_3_A";
import Subtask1_3_B from "./Subtask1_3_B";

// Form components mapping (Strategy Pattern)
export const SUBTASK_FORM_COMPONENTS: Record<
  string,
  React.ComponentType<any>
> = {
  "subtask-1-1-a": Subtask1_1_A,
  "subtask-1-1-b": Subtask1_1_B,
  "subtask-1-1-c": Subtask1_1_C,
  "subtask-1-2-a": Subtask1_2_A,
  "subtask-1-3-a": Subtask1_3_A,
  "subtask-1-3-b": Subtask1_3_B,
};

// Default form component if no specific formType is provided
export const DEFAULT_SUBTASK_FORM = Subtask1_1_A;

// Function to get the appropriate form component based on formType
export function getSubtaskFormComponent(formType?: string) {
  if (!formType) return DEFAULT_SUBTASK_FORM;
  return SUBTASK_FORM_COMPONENTS[formType] || DEFAULT_SUBTASK_FORM;
}

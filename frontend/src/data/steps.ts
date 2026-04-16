// frontend/src/data/steps.ts

import stepsData from "./steps.json";
import type { Step, Substep, Subtask } from "./steps.types";

export const stepsDataTyped: Step[] = stepsData as Step[];
export type { Step, Substep, Subtask };
export { stepsDataTyped as stepsData };

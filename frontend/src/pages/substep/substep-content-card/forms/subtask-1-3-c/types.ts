// frontend/src/pages/substep/substep-content-card/forms/subtask-1-3-c/types.ts

export type RequiredField =
  | "name"
  | "description"
  | "example"
  | "counter-example"
  | "quality-criterion"
  | "theoretical-reference"
  | "measurement-tool";

export type Granularity = "short" | "medium" | "long";
export type Template = "imperative" | "conditional" | "descriptive";

export interface HeuristicsFormatData {
  requiredFields: RequiredField[];
  granularity: Granularity | null;
  template: Template | null;
}

export interface SubmissionData {
  heuristicsFormat: HeuristicsFormatData;
  committedAt: string;
  username: string;
}

// 常量定义
export const REQUIRED_FIELDS: { value: RequiredField; label: string }[] = [
  { value: "name", label: "Name" },
  { value: "description", label: "Description" },
  { value: "example", label: "Example" },
  { value: "counter-example", label: "Counter-example" },
  { value: "quality-criterion", label: "Quality criterion" },
  { value: "theoretical-reference", label: "Theoretical reference" },
  { value: "measurement-tool", label: "Measurement tool" },
];

export const GRANULARITY_OPTIONS: {
  value: Granularity;
  label: string;
  description: string;
}[] = [
  { value: "short", label: "Short", description: "1 sentence" },
  { value: "medium", label: "Medium", description: "3-5 sentences" },
  { value: "long", label: "Long", description: "paragraph" },
];

export const TEMPLATE_OPTIONS: {
  value: Template;
  label: string;
  description: string;
}[] = [
  { value: "imperative", label: "Imperative", description: '"The AI must..."' },
  {
    value: "conditional",
    label: "Conditional",
    description: '"The AI should..."',
  },
  { value: "descriptive", label: "Descriptive", description: '"The AI..."' },
];

export const FIELD_LABELS: Record<RequiredField, string> = {
  name: "Name",
  description: "Description",
  example: "Example",
  "counter-example": "Counter-example",
  "quality-criterion": "Quality criterion",
  "theoretical-reference": "Theoretical reference",
  "measurement-tool": "Measurement tool",
};

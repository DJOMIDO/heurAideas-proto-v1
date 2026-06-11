// frontend/src/pages/substep/substep-content-card/forms/subtask-1-4-a/types.ts

export type ResourceLevel = "low" | "medium" | "high";

export interface ResourceField {
  level: ResourceLevel | null;
  comment: string;
}

export interface ResourcesData {
  // Stakeholders
  endUsers: ResourceField;
  domainExperts: ResourceField;
  heInspectors: {
    count: "1-2" | "3-5" | ">5" | null;
    comment: string;
  };

  // Documentary Resources
  scientificDatabases: ResourceField;
  domainDocumentation: ResourceField;
  projectDocumentation: {
    documents: string[];
  };

  // Material & Financial Resources
  financialLatitude: ResourceField;
  availableTools: {
    tools: string;
  };

  // Time Constraints
  timeline: ResourceField;
}

export interface SubmissionData extends ResourcesData {
  committedAt: string;
  username: string;
}

export const RESOURCE_LEVELS: ResourceLevel[] = ["low", "medium", "high"];

export const LEVEL_COLORS: Record<ResourceLevel, string> = {
  low: "#ef4444",
  medium: "#f59e0b",
  high: "#10b981",
};

export const LEVEL_BG_COLORS: Record<ResourceLevel, string> = {
  low: "bg-red-50",
  medium: "bg-amber-50",
  high: "bg-emerald-50",
};

export const LEVEL_BORDER_COLORS: Record<ResourceLevel, string> = {
  low: "border-red-200",
  medium: "border-amber-200",
  high: "border-emerald-200",
};

export const LEVEL_LABELS: Record<ResourceLevel, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

export const INSPECTOR_COUNTS = ["1-2", "3-5", ">5"] as const;

// frontend/src/pages/substep/substep-content-card/forms/subtask-1-2-a/types.ts
export type KnowledgeLevel = "none" | "low" | "medium" | "high" | "very-high";

export type KnowledgeDomain =
  | "heuristics-evaluation"
  | "about-the-soi"
  | "systems-engineering"
  | "inspected-criteria"
  | "interaction-design";

export interface KnowledgeData {
  [key: string]: KnowledgeLevel;
}

export interface TeamMember {
  id: number;
  username: string;
  knowledge?: KnowledgeData;
  submitted: boolean;
}

// 🔑 确保导出这些常量供其他文件使用
export const KNOWLEDGE_DOMAINS: KnowledgeDomain[] = [
  "heuristics-evaluation",
  "about-the-soi",
  "systems-engineering",
  "inspected-criteria",
  "interaction-design",
];

export const KNOWLEDGE_LEVELS: KnowledgeLevel[] = [
  "none",
  "low",
  "medium",
  "high",
  "very-high",
];

export const LEVEL_COLORS: Record<KnowledgeLevel, string> = {
  none: "#ef4444",
  low: "#f97316",
  medium: "#eab308",
  high: "#22c55e",
  "very-high": "#16a34a",
};

export const LEVEL_LABELS: Record<KnowledgeLevel, string> = {
  none: "None",
  low: "Low",
  medium: "Medium",
  high: "High",
  "very-high": "Very High",
};

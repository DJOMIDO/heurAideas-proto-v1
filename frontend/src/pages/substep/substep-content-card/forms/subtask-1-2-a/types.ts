// frontend/src/pages/substep/substep-content-card/forms/subtask-1-2-a/types.ts

export type KnowledgeLevel =
  | "none"
  | "very-low"
  | "low"
  | "medium"
  | "high"
  | "very-high";

export type KnowledgeDomain =
  | "heuristics-evaluation"
  | "soi"
  | "systems-engineering"
  | "interaction-design"
  | "inspected-criteria";

export type MethodologicalFreedomType =
  | "freedom-select-methodology"
  | "freedom-define-new-methodology";

export interface KnowledgeData {
  [key: string]: KnowledgeLevel;
}

export interface MethodologicalFreedomData {
  [key: string]: "yes" | "no";
}

export interface TeamMember {
  id: number;
  username: string;
  knowledge?: KnowledgeData;
  submitted: boolean;
}

export const KNOWLEDGE_DOMAINS: KnowledgeDomain[] = [
  "heuristics-evaluation",
  "soi",
  "systems-engineering",
  "interaction-design",
  "inspected-criteria",
];

export const METHODOLOGICAL_FREEDOM_QUESTIONS: MethodologicalFreedomType[] = [
  "freedom-select-methodology",
  "freedom-define-new-methodology",
];

export const KNOWLEDGE_LEVELS: KnowledgeLevel[] = [
  "none",
  "very-low",
  "low",
  "medium",
  "high",
  "very-high",
];

export const LEVEL_COLORS: Record<KnowledgeLevel, string> = {
  none: "#ef4444", // Red
  "very-low": "#fdba74", // Light Orange
  low: "#f97316", // Orange
  medium: "#eab308", // Yellow
  high: "#22c55e", // Green
  "very-high": "#16a34a", // Dark Green
};

export const LEVEL_LABELS: Record<KnowledgeLevel, string> = {
  none: "None",
  "very-low": "Very Low",
  low: "Low",
  medium: "Medium",
  high: "High",
  "very-high": "Very High",
};

export const LEVEL_DESCRIPTIONS: Record<
  KnowledgeDomain,
  Record<KnowledgeLevel, string>
> = {
  "heuristics-evaluation": {
    none: "No knowledge of HE",
    "very-low": "Aware of HE but never studied it",
    low: "Theoretical knowledge only through reading",
    medium: "Has applied HE at least once, with supervision",
    high: "Has conducted multiple HE autonomously",
    "very-high": "Expert, can train others and lead HE projects",
  },
  soi: {
    none: "No knowledge of SoI",
    "very-low": "Heard about the SoI without being able to define it",
    low: "Occasional exposition to the concept and its definition without specific experience",
    medium: "Knows SoI fundamentals (i.e. functions and main parts)",
    high: "Has previously contributed to the SoI system development",
    "very-high": "Officially recognized expert in the SoI system",
  },
  "systems-engineering": {
    none: "No knowledge of SE",
    "very-low": "Aware of SE concepts",
    low: "General notions of concepts and methods without project experience",
    medium:
      "Application of concepts and methods within a project under supervision",
    high: "Previous use of SE methods on a project without supervision",
    "very-high": "Officially recognized as a SE expert",
  },
  "interaction-design": {
    none: "No knowledge of interaction design",
    "very-low":
      "Aware that methodologies and specific taxonomy exist without being able to explain them",
    low: "Able to define some semantics without project experience",
    medium:
      "Application of concepts and methods within a project under supervision or without official methods",
    high: "Previous use of interaction design methods on a project without supervision",
    "very-high": "Officially recognized expert in interaction design",
  },
  "inspected-criteria": {
    none: "No knowledge about the inspected criteria",
    "very-low": "Aware that the criteria exist without being able to define it",
    low: "Has personal definition of the criteria",
    medium: "Knows scientific definitions of the criteria",
    high: "Knows scientific definition and models associated to the criteria",
    "very-high":
      "Has already evaluated this criteria as a professional in this domain",
  },
};

export const METHODOLOGICAL_FREEDOM_LABELS: Record<
  MethodologicalFreedomType,
  { title: string; description: string }
> = {
  "freedom-select-methodology": {
    title: "Freedom to select an HD methodology",
    description:
      "The team can freely choose which HD methodology to apply among published approaches (PROMETHEUS, R3C, AIDEAS...), without institutional or regulatory constraints imposing a specific framework.",
  },
  "freedom-define-new-methodology": {
    title: "Freedom to define a new methodology",
    description:
      "The team has the time, resources and authorization to create an original HD methodology rather than adapting an existing methodology.",
  },
};

export const DOMAIN_TITLES: Record<KnowledgeDomain, string> = {
  "heuristics-evaluation": "Heuristics Evaluation",
  "soi": "SoI",
  "systems-engineering": "Systems Engineering",
  "inspected-criteria": "Inspected Criteria",
  "interaction-design": "Interaction Design",
};

export interface Subtask {
  id: string;
  title: string;
  description: string;
  status?: "todo" | "in-progress" | "completed";
}

export interface Substep {
  id: string;
  title: string;
  status?: "todo" | "in-progress" | "completed";
  subtasks: Subtask[];
}

export interface Step {
  id: number;
  title: string;
  description: string;
  status?: "todo" | "in-progress" | "completed";
  substeps: Substep[];
}

export const stepsData: Step[] = [
  {
    id: 1,
    title: "Prerequisite",
    description: "To be completed...",
    substeps: [
      {
        id: "1.1",
        title: "System of interest context definition",
        subtasks: [
          {
            id: "a",
            description: "To be completed...",
            title: "Mission definition",
          },
          {
            id: "b",
            description: "To be completed...",
            title: "System of interest definition",
          },
          {
            id: "c",
            description: "To be completed...",
            title: "System's value analysis",
          },
        ],
      },
      {
        id: "1.2",
        title: "Definition of the project’s stakeholders",
        subtasks: [
          {
            id: "a",
            description: "To be completed...",
            title: "The name given to the stakeholder",
          },
          {
            id: "b",
            description: "To be completed...",
            title: "The mission given for the project",
          },
          {
            id: "c",
            description: "To be completed...",
            title: "The role for the project",
          },
          {
            id: "d",
            description: "To be completed...",
            title: "The level of knowledge about",
          },
          {
            id: "e",
            description: "To be completed...",
            title: "The stakeholders’eventual constraint",
          },
        ],
      },
      {
        id: "1.3",
        title: "HE confirmation",
        subtasks: [
          {
            id: "a",
            description: "To be completed...",
            title: "Definition of the HE motivation",
          },
          {
            id: "b",
            description: "To be completed...",
            title: "HE timeline",
          },
        ],
      },
      {
        id: "1.4",
        title: "Marking out the situational room of maneuver",
        subtasks: [
          {
            id: "a",
            description: "To be completed...",
            title: "The internal SRM (ISRM)",
          },
          {
            id: "b",
            description: "To be completed...",
            title: "The external SRM (ESRM)",
          },
        ],
      },
    ],
  },
];

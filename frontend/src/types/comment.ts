// frontend/src/types/comment.ts

export interface Comment {
  id: string;
  projectId: number;
  stepId: number;
  substepId: string;
  subtaskId?: string;
  anchorType: "free" | "element" | "stakeholder" | "section";
  position?: { x: number; y: number };
  anchorId?: string;
  content: string;
  authorId: number;
  authorName: string;
  createdAt: string;
  resolved: boolean;
  parentId?: string;
}

export interface CommentState {
  comments: Comment[];
  lastUpdated: string;
}

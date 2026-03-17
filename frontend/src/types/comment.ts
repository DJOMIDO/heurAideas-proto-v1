// frontend/src/types/comment.ts

export interface Comment {
  id: number;
  projectId: number;
  stepId?: number;
  substepId: number;
  subtaskId?: number;
  anchorType: "free" | "element" | "stakeholder" | "section";
  anchorId?: string;
  position?: { x: number; y: number };
  content: string;
  authorId: number;
  authorName: string;
  createdAt: string;
  updatedAt?: string;
  resolved: boolean;
  deleted?: boolean;
  edited?: boolean;
  parentId?: number;
  replies?: Comment[];
}

// 评论列表响应（包含统计信息）
export interface CommentListResponse {
  total: number;
  comments: Comment[];
  resolved_count: number;
  unresolved_count: number;
}

// 评论统计响应
export interface CommentCountResponse {
  total: number;
  resolved: number;
  unresolved: number;
  by_substep: Record<string, number>;
}

// 评论状态（localStorage 使用）
export interface CommentState {
  comments: Comment[];
  lastUpdated: string;
}
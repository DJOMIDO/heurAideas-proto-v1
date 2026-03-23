// frontend/src/types/comment.ts

export interface Comment {
  id: number | string;
  projectId: number;
  stepId?: number;
  substepId: number | string;
  subtaskId?: number | string;
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
  parentId?: number | string;
  replies?: Comment[];
  project_id?: number;
  project_step_id?: number;
  project_substep_id?: number;
  project_subtask_code?: string;
  position_x?: number;
  position_y?: number;
  anchor_type?: string;
  anchor_id?: string;
  author_id?: number;
  author_name?: string;
  is_resolved?: boolean;
  is_deleted?: boolean;
  is_edited?: boolean;
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

// frontend/src/utils/comment.ts

// 重新导出 getInitials，保持向后兼容
export { getInitials } from "@/utils/string";

/**
 * 格式化日期字符串
 * 兼容多种日期格式（包括 UTC 时间）
 */
export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return "Unknown";

  let date: Date;
  try {
    date = new Date(dateString);
    if (isNaN(date.getTime())) {
      date = new Date(dateString + "Z");
    }
    if (isNaN(date.getTime())) {
      return "Invalid Date";
    }
  } catch (e) {
    return "Invalid Date";
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * 检查评论是否是回复（有 parentId）
 */
export function isReply(comment: {
  parentId?: string | number | null;
}): boolean {
  return (
    comment.parentId !== null &&
    comment.parentId !== undefined &&
    comment.parentId !== ""
  );
}

/**
 * 兼容 snake_case 和 camelCase 字段名
 */
export function normalizeCommentFields(comment: any): any {
  return {
    ...comment,
    authorName: comment.author_name ?? comment.authorName ?? "Unknown",
    createdAt:
      comment.created_at ?? comment.createdAt ?? new Date().toISOString(),
    authorId: comment.author_id ?? comment.authorId,
    isEdited: comment.is_edited ?? comment.edited ?? false,
    isResolved: comment.is_resolved ?? comment.resolved ?? false,
    isDeleted: comment.is_deleted ?? comment.deleted ?? false,
    parentId: comment.parent_id ?? comment.parentId,
    subtaskId: comment.project_subtask_code ?? comment.subtaskId,
  };
}

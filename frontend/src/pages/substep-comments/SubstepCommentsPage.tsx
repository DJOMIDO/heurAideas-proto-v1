// src/pages/substep-comments/SubstepCommentsPage.tsx

import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useCallback, useRef } from "react";
import {
  getSubstepComments,
  createComment,
  updateComment as updateCommentApi,
  deleteComment as deleteCommentApi,
  resolveComment,
} from "@/api/comments";
import { getProjectDetail } from "@/api/projects";
import type { ProjectDetail } from "@/types/project";
import { getUserInfo } from "@/utils/auth";
import { syncCommentsFromApi } from "@/utils/commentState";

import CommentHeader from "./CommentHeader";
import CommentFilters from "./CommentFilters";
import CommentList from "./CommentList";

import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";

export default function SubstepCommentsPage() {
  const { projectId, stepId, substepId } = useParams();
  const navigate = useNavigate();

  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "resolved" | "unresolved">(
    "all",
  );
  const [subtaskFilter, setSubtaskFilter] = useState<string>("all");
  const [subtasks, setSubtasks] = useState<
    { id: string; code: string; title: string }[]
  >([]);

  // 回复相关状态
  const [replyingTo, setReplyingTo] = useState<string | number | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);

  // 获取当前用户信息
  const currentUser = getUserInfo();
  const currentUserId = currentUser?.id || 1;

  // 存储 projectSubstepId
  const projectSubstepIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!projectId || !substepId) return;

    // 使用 syncCommentsFromApi 加载评论（确保 parentId 正确设置）
    const loadComments = async () => {
      try {
        // 1. 先获取 projectSubstepId
        const projectSubstepId = await getProjectSubstepId(
          Number(projectId),
          substepId,
        );

        if (projectSubstepId) {
          projectSubstepIdRef.current = projectSubstepId;
          // 2. 使用 syncCommentsFromApi（会展平树形结构并设置 parentId）
          const syncedComments = await syncCommentsFromApi(
            Number(projectId),
            substepId,
            projectSubstepId,
          );
          setComments(syncedComments);
          console.log(
            "[SubstepCommentsPage] Loaded comments with syncCommentsFromApi:",
            syncedComments.length,
          );
        } else {
          // 3. 降级方案：如果没有 projectSubstepId，使用原始 API
          const response = await getSubstepComments(
            substepId,
            Number(projectId),
          );
          setComments(response.comments);
        }
      } catch (error) {
        console.error("Failed to load comments:", error);
      } finally {
        setLoading(false);
      }
    };

    loadComments();

    // 加载 Subtasks
    getProjectDetail(Number(projectId))
      .then((detail: ProjectDetail) => {
        const step = detail.steps.find(
          (s: { id: number; substeps: any[] }) => s.id === Number(stepId),
        );
        const substep = step?.substeps.find(
          (s: { code: string }) => s.code === substepId,
        );
        if (substep?.subtasks) {
          setSubtasks(
            substep.subtasks.map((t: { code: string; title: string }) => ({
              id: t.code,
              code: t.code,
              title: t.title,
            })),
          );
        }
      })
      .catch((error: Error) => {
        console.error("Failed to load subtasks:", error);
      });
  }, [projectId, stepId, substepId]);

  const filteredComments = comments.filter((comment) => {
    if (filter === "resolved" && !comment.is_resolved) return false;
    if (filter === "unresolved" && comment.is_resolved) return false;
    if (
      subtaskFilter !== "all" &&
      comment.project_subtask_code !== subtaskFilter
    ) {
      return false;
    }
    return true;
  });

  // 处理回复
  const handleReply = useCallback(
    async (parentId: string | number, content: string) => {
      if (!projectId || !substepId) return;

      setIsSubmittingReply(true);

      try {
        const projectSubstepId = await getProjectSubstepId(
          Number(projectId),
          substepId,
        );

        if (!projectSubstepId) {
          console.error("Project substep ID not found");
          setIsSubmittingReply(false);
          return;
        }

        // 调用 API 创建回复
        await createComment({
          projectId: Number(projectId),
          projectSubstepId,
          projectStepId: Number(stepId),
          content,
          parentId: typeof parentId === "number" ? parentId : undefined,
        });

        // 重新加载评论
        const response = await getSubstepComments(substepId, Number(projectId));
        setComments(response.comments);

        // 重置状态
        setReplyingTo(null);
        setReplyContent("");
      } catch (error) {
        console.error("Failed to submit reply:", error);
      } finally {
        setIsSubmittingReply(false);
      }
    },
    [projectId, stepId, substepId],
  );

  // 处理编辑评论
  const handleEdit = useCallback(
    async (commentId: string | number, newContent: string) => {
      if (!projectId || !substepId) return;

      // 1. 立即更新本地状态（乐观更新）
      setComments((prev) =>
        prev.map((c) =>
          c.id === commentId
            ? { ...c, content: newContent, is_edited: true }
            : c,
        ),
      );

      // 2. 同步到 API（只有已同步的评论）
      if (typeof commentId === "number") {
        try {
          await updateCommentApi(commentId, {
            content: newContent,
          });

          console.log("[SubstepCommentsPage] Comment updated:", commentId);

          // 3. 重新加载评论确保一致性
          const response = await getSubstepComments(
            substepId,
            Number(projectId),
          );
          setComments(response.comments);
        } catch (error) {
          console.error("[SubstepCommentsPage] Edit failed:", error);
          // 4. API 失败回滚
          setComments((prev) =>
            prev.map((c) =>
              c.id === commentId
                ? { ...c, content: c.content, is_edited: c.is_edited }
                : c,
            ),
          );
        }
      }
    },
    [projectId, substepId],
  );

  // 辅助函数：收集所有子回复 ID（递归）
  const collectReplyIds = (
    commentId: string | number,
    allComments: any[],
  ): (string | number)[] => {
    const replyIds: (string | number)[] = [];

    console.log(
      "[collectReplyIds] Start - commentId:",
      commentId,
      "total comments:",
      allComments.length,
    );

    const findReplies = (parentId: string | number) => {
      const replies = allComments.filter((c) => {
        const cParentId = c.parent_id ?? c.parentId;
        return cParentId == parentId; // 使用 == 进行类型转换比较
      });

      console.log(
        "[collectReplyIds] Found replies for parent",
        parentId,
        ":",
        replies.map((r) => r.id),
      );

      replies.forEach((reply) => {
        replyIds.push(reply.id);
        findReplies(reply.id); // 递归查找更深层
      });
    };

    findReplies(commentId);

    console.log("[collectReplyIds] Total replyIds to delete:", replyIds);

    return replyIds;
  };

  // 处理删除评论（删除前强制获取最新数据）
  const handleDelete = useCallback(
    async (commentId: string | number) => {
      if (!projectId || !substepId) return;

      try {
        // 1. 获取 projectSubstepId
        const projectSubstepId = await getProjectSubstepId(
          Number(projectId),
          substepId,
        );

        // 2. 强制获取最新评论数据（不依赖 state）
        let freshComments = comments; // 降级使用 state
        if (projectSubstepId) {
          freshComments = await syncCommentsFromApi(
            Number(projectId),
            substepId,
            projectSubstepId,
          );
          console.log(
            "[SubstepCommentsPage] Fetched fresh comments for delete:",
            freshComments.length,
          );
        }

        // 3. 使用最新数据收集子回复 ID
        const replyIds = collectReplyIds(commentId, freshComments);

        console.log(
          "[SubstepCommentsPage] Deleting comment:",
          commentId,
          "and replies:",
          replyIds,
        );

        // 4. 执行删除
        if (typeof commentId === "number") {
          await deleteCommentApi(commentId);

          for (const replyId of replyIds) {
            if (typeof replyId === "number") {
              console.log("[SubstepCommentsPage] Deleting reply:", replyId);
              await deleteCommentApi(replyId).catch(() => {
                console.warn(
                  "[SubstepCommentsPage] Failed to delete reply:",
                  replyId,
                );
              });
            }
          }
        }

        // 5. 删除后重新加载
        if (projectSubstepId) {
          const syncedComments = await syncCommentsFromApi(
            Number(projectId),
            substepId,
            projectSubstepId,
          );
          setComments(syncedComments);
        } else {
          const response = await getSubstepComments(
            substepId,
            Number(projectId),
          );
          setComments(response.comments);
        }
      } catch (error) {
        console.error("[SubstepCommentsPage] Delete failed:", error);
      }
    },
    [projectId, substepId, comments],
  );

  // 处理 Resolve 评论
  const handleResolve = useCallback(
    async (commentId: string | number) => {
      if (!projectId || !substepId) return;

      // 1. 找到当前评论状态
      const comment = comments.find((c) => c.id === commentId);
      if (!comment) return;

      const newResolvedState = !comment.is_resolved;

      // 2. 立即更新本地状态（乐观更新）
      setComments((prev) =>
        prev.map((c) =>
          c.id === commentId ? { ...c, is_resolved: newResolvedState } : c,
        ),
      );

      // 3. 同步到 API（只有已同步的评论）
      if (typeof commentId === "number") {
        try {
          await resolveComment(commentId);

          console.log("[SubstepCommentsPage] Comment resolved:", commentId);

          // 4. 重新加载评论确保一致性
          const response = await getSubstepComments(
            substepId,
            Number(projectId),
          );
          setComments(response.comments);
        } catch (error) {
          console.error("[SubstepCommentsPage] Resolve failed:", error);
          // 5. API 失败回滚
          setComments((prev) =>
            prev.map((c) =>
              c.id === commentId
                ? { ...c, is_resolved: comment.is_resolved }
                : c,
            ),
          );
        }
      }
    },
    [projectId, substepId, comments],
  );

  // 获取 projectSubstepId
  const getProjectSubstepId = async (
    projectId: number,
    substepCode: string,
  ): Promise<number | null> => {
    try {
      const detail = await getProjectDetail(projectId);
      for (const step of detail.steps) {
        for (const substep of step.substeps) {
          if (substep.code === substepCode) {
            return substep.id;
          }
        }
      }
    } catch (error) {
      console.error(
        "[SubstepCommentsPage] Failed to get projectSubstepId:",
        error,
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <CommentHeader
        substepId={substepId || ""}
        totalComments={comments.length}
        filteredComments={filteredComments.length}
        filter={filter}
        onBack={() => navigate(-1)}
      />

      <CommentFilters
        filter={filter}
        onFilterChange={setFilter}
        subtaskFilter={subtaskFilter}
        onSubtaskFilterChange={setSubtaskFilter}
        subtasks={subtasks}
      />

      <ScrollArea className="flex-1">
        <div className="p-6 h-full">
          <Card className="h-full">
            <CardContent className="p-0 h-full">
              {loading ? (
                <CommentListSkeleton />
              ) : filteredComments.length === 0 ? (
                <EmptyState />
              ) : (
                <CommentList
                  comments={filteredComments}
                  replyingTo={replyingTo}
                  setReplyingTo={setReplyingTo}
                  replyContent={replyContent}
                  setReplyContent={setReplyContent}
                  onReply={handleReply}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onResolve={handleResolve}
                  isSubmittingReply={isSubmittingReply}
                  currentUserId={currentUserId}
                />
              )}
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </div>
  );
}

function CommentListSkeleton() {
  return (
    <div className="divide-y divide-gray-100">
      {[1, 2, 3].map((i) => (
        <div key={i} className="p-4 space-y-3">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <Skeleton className="h-16 w-full" />
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[650px] text-center p-12">
      <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
        <svg
          className="w-10 h-10 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
      </div>
      <h3 className="text-xl font-medium text-gray-900 mb-2">
        No comments yet
      </h3>
      <p className="text-base text-gray-500 max-w-md">
        Comments added to this substep will appear here.
        <br />
        Add comments from the substep detail view.
      </p>
    </div>
  );
}

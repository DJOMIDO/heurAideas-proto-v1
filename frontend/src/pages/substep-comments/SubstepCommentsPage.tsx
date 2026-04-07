// src/pages/substep-comments/SubstepCommentsPage.tsx

import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useCallback, useRef, useMemo } from "react";
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

import { useWebSocket } from "@/hooks/useWebSocket";

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

  // 辅助函数：递归更新树形结构中的评论
  const updateCommentInTree = useCallback(
    (tree: any[], commentId: string | number, updates: Partial<any>): any[] => {
      return tree.map((comment) => {
        if (comment.id === commentId) {
          return { ...comment, ...updates };
        }
        if (comment.replies && comment.replies.length > 0) {
          return {
            ...comment,
            replies: updateCommentInTree(comment.replies, commentId, updates),
          };
        }
        return comment;
      });
    },
    [],
  );

  // 辅助函数：递归从树形结构中删除评论
  const deleteCommentFromTree = useCallback(
    (tree: any[], commentId: string | number): any[] => {
      return tree
        .filter((comment) => comment.id !== commentId)
        .map((comment) => {
          if (comment.replies && comment.replies.length > 0) {
            return {
              ...comment,
              replies: deleteCommentFromTree(comment.replies, commentId),
            };
          }
          return comment;
        });
    },
    [],
  );

  // 辅助函数：将扁平数组转换为树形结构
  const buildCommentTree = useCallback((flatComments: any[]): any[] => {
    const commentMap = new Map();
    const rootComments: any[] = [];

    flatComments.forEach((comment) => {
      commentMap.set(comment.id, {
        ...comment,
        replies: [],
      });
    });

    flatComments.forEach((comment) => {
      const node = commentMap.get(comment.id);
      const parentId = comment.parent_id ?? comment.parentId;

      if (parentId === null || parentId === undefined || parentId === "") {
        rootComments.push(node);
      } else {
        const parent = commentMap.get(parentId);
        if (parent) {
          parent.replies.push(node);
        } else {
          rootComments.push(node);
        }
      }
    });

    return rootComments;
  }, []);

  useEffect(() => {
    if (!projectId || !substepId) return;

    const loadComments = async () => {
      try {
        const projectSubstepId = await getProjectSubstepId(
          Number(projectId),
          substepId,
        );

        if (projectSubstepId) {
          projectSubstepIdRef.current = projectSubstepId;
          const syncedComments = await syncCommentsFromApi(
            Number(projectId),
            substepId,
            projectSubstepId,
          );

          const fixedComments = syncedComments.map((c: any) => ({
            ...c,
            parentId: c.parent_id ?? c.parentId ?? null,
          }));

          const treeComments = buildCommentTree(fixedComments);
          setComments(treeComments);
        } else {
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
  }, [projectId, stepId, substepId, buildCommentTree]);

  // WebSocket 实时刷新评论
  useWebSocket({
  projectId: projectId ? Number(projectId) : 0,  // 添加三元表达式
  enabled: !!projectId && !!substepId,
  onMessage: (message) => {
    if (['comment_added', 'comment_updated', 'comment_deleted'].includes(message.type)) {
      // 重新加载评论（复用现有逻辑）
      const loadComments = async () => {
        try {
          const projectSubstepId = await getProjectSubstepId(
            Number(projectId),
            substepId!,  // 添加非空断言，因为 enabled 已检查
          );

          if (projectSubstepId) {
            projectSubstepIdRef.current = projectSubstepId;
            const syncedComments = await syncCommentsFromApi(
              Number(projectId),
              substepId!,  // 添加非空断言
              projectSubstepId,
            );
            const fixedComments = syncedComments.map((c: any) => ({
              ...c,
              parentId: c.parent_id ?? c.parentId ?? null,
            }));
            setComments(buildCommentTree(fixedComments));
          }
        } catch (error) {
          console.error("Failed to reload comments:", error);
        }
      };
      loadComments();
    }
  },
});

  // 筛选逻辑
  const filteredComments = useMemo(() => {
    const filterTree = (comments: any[]): any[] => {
      return comments
        .filter((comment) => {
          const isResolved = comment.is_resolved ?? comment.resolved ?? false;
          const subtaskCode =
            comment.project_subtask_code ?? comment.subtaskId ?? "";

          if (filter === "resolved" && !isResolved) return false;
          if (filter === "unresolved" && isResolved) return false;

          if (
            subtaskFilter !== "all" &&
            String(subtaskCode) !== String(subtaskFilter)
          ) {
            return false;
          }

          return true;
        })
        .map((comment) => ({
          ...comment,
          replies: filterTree(comment.replies || []),
        }));
    };

    return filterTree(comments);
  }, [comments, filter, subtaskFilter]);

  const filteredCount = filteredComments.length;
  const totalCount = comments.length;

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

        await createComment({
          projectId: Number(projectId),
          projectSubstepId,
          projectStepId: Number(stepId),
          content,
          parentId: typeof parentId === "number" ? parentId : undefined,
        });

        // 重新加载并转换为树形结构
        const syncedComments = await syncCommentsFromApi(
          Number(projectId),
          substepId,
          projectSubstepId,
        );
        const fixedComments = syncedComments.map((c: any) => ({
          ...c,
          parentId: c.parent_id ?? c.parentId ?? null,
        }));
        setComments(buildCommentTree(fixedComments));

        setReplyingTo(null);
        setReplyContent("");
      } catch (error) {
        console.error("Failed to submit reply:", error);
      } finally {
        setIsSubmittingReply(false);
      }
    },
    [projectId, stepId, substepId, buildCommentTree],
  );

  // 处理编辑评论（使用递归更新）
  const handleEdit = useCallback(
    async (commentId: string | number, newContent: string) => {
      if (!projectId || !substepId) return;

      // 1. 立即更新本地状态（乐观更新，递归）
      setComments((prev) =>
        updateCommentInTree(prev, commentId, {
          content: newContent,
          is_edited: true,
        }),
      );

      // 2. 同步到 API
      if (typeof commentId === "number") {
        try {
          await updateCommentApi(commentId, {
            content: newContent,
          });

          // 3. 重新加载并转换为树形结构
          const projectSubstepId = projectSubstepIdRef.current;
          if (projectSubstepId) {
            const syncedComments = await syncCommentsFromApi(
              Number(projectId),
              substepId,
              projectSubstepId,
            );
            const fixedComments = syncedComments.map((c: any) => ({
              ...c,
              parentId: c.parent_id ?? c.parentId ?? null,
            }));
            setComments(buildCommentTree(fixedComments));
          }
        } catch (error) {
          console.error("[SubstepCommentsPage] Edit failed:", error);
          // 4. API 失败回滚
          setComments((prev) =>
            updateCommentInTree(prev, commentId, {
              is_edited: false,
            }),
          );
        }
      }
    },
    [projectId, substepId, updateCommentInTree, buildCommentTree],
  );

  // 处理删除评论（使用递归删除 + 树形重建）
  const handleDelete = useCallback(
    async (commentId: string | number) => {
      if (!projectId || !substepId) return;

      try {
        // 1. 先更新本地状态（立即删除，递归）
        setComments((prev) => deleteCommentFromTree(prev, commentId));

        // 2. 获取 projectSubstepId
        const projectSubstepId = await getProjectSubstepId(
          Number(projectId),
          substepId,
        );

        // 3. 执行 API 删除
        if (typeof commentId === "number") {
          await deleteCommentApi(commentId);
        }

        // 4. 重新加载并转换为树形结构
        if (projectSubstepId) {
          const syncedComments = await syncCommentsFromApi(
            Number(projectId),
            substepId,
            projectSubstepId,
          );
          const fixedComments = syncedComments.map((c: any) => ({
            ...c,
            parentId: c.parent_id ?? c.parentId ?? null,
          }));
          setComments(buildCommentTree(fixedComments));
        }
      } catch (error) {
        console.error("[SubstepCommentsPage] Delete failed:", error);
        // 失败后重新加载
        const projectSubstepId = projectSubstepIdRef.current;
        if (projectSubstepId) {
          const syncedComments = await syncCommentsFromApi(
            Number(projectId),
            substepId,
            projectSubstepId,
          );
          const fixedComments = syncedComments.map((c: any) => ({
            ...c,
            parentId: c.parent_id ?? c.parentId ?? null,
          }));
          setComments(buildCommentTree(fixedComments));
        }
      }
    },
    [projectId, substepId, deleteCommentFromTree, buildCommentTree],
  );

  // 处理 Resolve 评论（使用递归更新）
  const handleResolve = useCallback(
    async (commentId: string | number) => {
      if (!projectId || !substepId) return;

      // 1. 找到当前评论状态（需要展平树形结构）
      const flattenTree = (comments: any[]): any[] => {
        const flat: any[] = [];
        const traverse = (list: any[]) => {
          for (const comment of list) {
            const { replies, ...commentWithoutReplies } = comment;
            flat.push(commentWithoutReplies);
            if (comment.replies && comment.replies.length > 0) {
              traverse(comment.replies);
            }
          }
        };
        traverse(comments);
        return flat;
      };

      const flatComments = flattenTree(comments);
      const comment = flatComments.find((c) => c.id === commentId);
      if (!comment) return;

      const newResolvedState = !comment.is_resolved;

      // 2. 立即更新本地状态（乐观更新，递归）
      setComments((prev) =>
        updateCommentInTree(prev, commentId, {
          is_resolved: newResolvedState,
        }),
      );

      // 3. 同步到 API
      if (typeof commentId === "number") {
        try {
          await resolveComment(commentId);

          // 4. 重新加载并转换为树形结构
          const projectSubstepId = projectSubstepIdRef.current;
          if (projectSubstepId) {
            const syncedComments = await syncCommentsFromApi(
              Number(projectId),
              substepId,
              projectSubstepId,
            );
            const fixedComments = syncedComments.map((c: any) => ({
              ...c,
              parentId: c.parent_id ?? c.parentId ?? null,
            }));
            setComments(buildCommentTree(fixedComments));
          }
        } catch (error) {
          console.error("[SubstepCommentsPage] Resolve failed:", error);
          // 5. API 失败回滚
          setComments((prev) =>
            updateCommentInTree(prev, commentId, {
              is_resolved: comment.is_resolved,
            }),
          );
        }
      }
    },
    [projectId, substepId, comments, updateCommentInTree, buildCommentTree],
  );

  // 获取 projectSubstepId
  const getProjectSubstepId = useCallback(
    async (projectId: number, substepCode: string): Promise<number | null> => {
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
    },
    [],
  );

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <CommentHeader
        substepId={substepId || ""}
        totalComments={totalCount}
        filteredComments={filteredCount}
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

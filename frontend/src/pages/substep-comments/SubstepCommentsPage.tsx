// src/pages/substep-comments/SubstepCommentsPage.tsx

import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { getSubstepComments } from "@/api/comments";
import { getProjectDetail } from "@/api/projects";
import type { ProjectDetail } from "@/types/project";

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

  useEffect(() => {
    if (!projectId || !substepId) return;

    getSubstepComments(substepId, Number(projectId))
      .then((response) => {
        setComments(response.comments);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Failed to load comments:", error);
        setLoading(false);
      });

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

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <CommentHeader
        substepId={substepId || ""}
        totalComments={filteredComments.length}
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
                <CommentList comments={filteredComments} />
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

// src/pages/overview/DetailPanel.tsx

import { useState, useEffect } from "react";
import { ResizablePanel } from "@/components/ui/resizable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { FileText, MessageSquare } from "lucide-react";
import { type Substep } from "@/data/steps";
import { getUserId } from "@/utils/auth";
import { getCommentState, syncCommentsFromApi } from "@/utils/commentState";

interface DetailPanelProps {
  substep: Substep | null;
}

export default function DetailPanel({ substep }: DetailPanelProps) {
  const [commentCount, setCommentCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  const userId = getUserId();
  const storageKey = userId ? `currentProjectId-${userId}` : "currentProjectId";
  const projectId = Number(localStorage.getItem(storageKey) || "1");

  // 监听 substep 变化 + 同步 API 数据
  useEffect(() => {
    if (!substep?.id) {
      setCommentCount(0);
      return;
    }

    const syncAndCount = async () => {
      setIsSyncing(true);

      // 先同步 API 数据到 localStorage
      const projectSubstepId = await getProjectSubstepId(
        projectId,
        substep.id!,
      );
      if (projectSubstepId) {
        await syncCommentsFromApi(projectId, substep.id!, projectSubstepId);
      }

      // 然后计数
      updateCount();
      setIsSyncing(false);
    };

    const updateCount = () => {
      const state = getCommentState(projectId, substep.id!);
      if (!state) {
        setCommentCount(0);
        return;
      }

      const count = state.comments.filter((c) => {
        // 排除回复
        if (
          c.parentId !== null &&
          c.parentId !== undefined &&
          c.parentId !== ""
        ) {
          return false;
        }
        // 排除已删除
        if (c.deleted === true || c.is_deleted === true) {
          return false;
        }
        return true;
      }).length;

      setCommentCount(count);
    };

    syncAndCount();

    // 监听 localStorage 变化
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key?.includes(`substep-comments-${projectId}-${substep.id}`)) {
        updateCount();
      }
    };

    window.addEventListener("storage", handleStorageChange);

    // 定期刷新（5 秒）
    const interval = setInterval(updateCount, 5000);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(interval);
    };
  }, [projectId, substep?.id]);

  // 获取 projectSubstepId 的辅助函数
  const getProjectSubstepId = async (
    projectId: number,
    substepCode: string,
  ): Promise<number | null> => {
    try {
      const { getProjectDetail } = await import("@/api/projects");
      const detail = await getProjectDetail(projectId);
      for (const step of detail.steps) {
        for (const substep of step.substeps) {
          if (substep.code === substepCode) {
            return substep.id;
          }
        }
      }
    } catch (error) {
      console.error("[DetailPanel] Failed to get projectSubstepId:", error);
    }
    return null;
  };

  const handleViewComments = () => {
    if (!substep?.id) return;
  };

  return (
    <ResizablePanel defaultSize="75" minSize="20" className="bg-gray-50">
      <div className="h-full overflow-y-auto p-6">
        {substep ? (
          <Card className="h-full border shadow-sm">
            <CardHeader className="pb-3 border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl flex items-center gap-2">
                  {substep.title}
                </CardTitle>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleViewComments}
                  disabled={isSyncing}
                  className={`
                    flex items-center gap-1.5 px-3 py-1.5 h-auto font-medium transition-all
                    ${
                      commentCount > 0
                        ? "bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 hover:border-blue-300"
                        : "bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100 hover:border-gray-300"
                    }
                  `}
                >
                  <MessageSquare
                    className={`w-4 h-4 ${commentCount > 0 ? "fill-blue-700" : "fill-gray-400"}`}
                  />
                  <span>
                    {isSyncing
                      ? "Loading..."
                      : commentCount > 0
                        ? `${commentCount} ${commentCount === 1 ? "Comment" : "Comments"}`
                        : "No Comments"}
                  </span>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div>
                <h4 className="text-sm font-semibold text-gray-500 mb-1">
                  Description
                </h4>
                <p className="text-gray-700 leading-relaxed">
                  {substep.description || "No description available."}
                </p>
              </div>

              <div className="pt-4">
                {substep.subtasks && substep.subtasks.length > 0 ? (
                  <Accordion
                    type="single"
                    collapsible
                    className="w-full"
                    defaultValue={substep.subtasks[0]?.id}
                  >
                    {substep.subtasks.map((task) => (
                      <AccordionItem key={task.id} value={task.id}>
                        <AccordionTrigger className="hover:no-underline">
                          {task.title}
                        </AccordionTrigger>
                        <AccordionContent>
                          <p className="text-gray-600 text-sm mb-2">
                            {task.description || "No description provided"}
                          </p>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                ) : (
                  <p className="text-sm text-gray-500">No tasks available</p>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-gray-400">
            <FileText className="w-16 h-16 mb-4 opacity-30" />
            <p>Select a substep to view details</p>
          </div>
        )}
      </div>
    </ResizablePanel>
  );
}

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
import { getCommentState } from "@/utils/commentState";

interface DetailPanelProps {
  substep: Substep | null;
}

export default function DetailPanel({ substep }: DetailPanelProps) {
  const [commentCount, setCommentCount] = useState(0);

  // 获取当前项目 ID
  const userId = getUserId();
  const storageKey = userId ? `currentProjectId-${userId}` : "currentProjectId";
  const projectId = Number(localStorage.getItem(storageKey) || "1");

  // 监听 substep 变化，加载评论数量
  useEffect(() => {
    if (!substep?.id) {
      setCommentCount(0);
      return;
    }

    const state = getCommentState(projectId, substep.id);
    const count = state?.comments?.length || 0;
    setCommentCount(count);
  }, [projectId, substep?.id]);

  // 处理点击跳转到评论页面
  const handleViewComments = () => {
    if (!substep?.id) return;
    // TODO: 后续实现评论详情页面路由
    // navigate(`/substep/${projectId}/${stepId}/${substep.id}/comments`);
    console.log("View comments for substep:", substep.id);
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
                    {commentCount > 0
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

// frontend/src/pages/substep/substep-content-card/forms/Subtask1_2_A.tsx

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertCircle, Hourglass, Users } from "lucide-react";
import TypingIndicator from "@/components/TypingIndicator";
import KnowledgeLevelChart from "./subtask-1-2-a/KnowledgeLevelChart";
import type {
  KnowledgeData,
  KnowledgeDomain,
  KnowledgeLevel,
} from "./subtask-1-2-a/types";
import {
  KNOWLEDGE_DOMAINS,
  KNOWLEDGE_LEVELS,
  LEVEL_COLORS,
  LEVEL_LABELS,
} from "./subtask-1-2-a/types";

interface Subtask1_2_AProps {
  fieldPrefix: string;
  formData: Record<string, any>;
  onFormDataChange: (field: string, value: any) => void;
  editingUsers?: Record<
    string,
    { userId: number; username: string; timestamp: string }
  >;
}

export default function Subtask1_2_A({
  fieldPrefix,
  formData,
  onFormDataChange,
  editingUsers = {},
}: Subtask1_2_AProps) {
  const [hasCommitted, setHasCommitted] = useState(false);

  // 从 formData 实时计算 individualKnowledge
  const individualKnowledge = useMemo<KnowledgeData>(() => {
    const data: KnowledgeData = {};
    KNOWLEDGE_DOMAINS.forEach((domain) => {
      const value = formData[`${fieldPrefix}-${domain}`];
      // 确保值是有效的 KnowledgeLevel
      if (KNOWLEDGE_LEVELS.includes(value as KnowledgeLevel)) {
        data[domain] = value as KnowledgeLevel;
      } else {
        data[domain] = "none";
      }
    });
    return data;
  }, [formData, fieldPrefix]); // 依赖项确保 formData 或 fieldPrefix 变化时重新计算

  const handleKnowledgeChange = (domain: KnowledgeDomain, level: string) => {
    // 直接调用 onFormDataChange，确保父组件状态更新
    onFormDataChange(`${fieldPrefix}-${domain}`, level);
    // 不需要手动触发重渲染，useMemo + formData 依赖会处理
  };

  const handleCommitToTeam = () => {
    setHasCommitted(true);
    // TODO: 实际场景这里会调用 API 提交数据
  };

  // 模拟团队数据（实际应从 API 获取）
  const teamMembers = [
    { id: 1, username: "Alice", submitted: true },
    { id: 2, username: "Bob", submitted: false },
    { id: 3, username: "Charlie", submitted: false },
  ];
  const missingCount = teamMembers.filter((m) => !m.submitted).length;
  const allSubmitted = missingCount === 0;

  return (
    <div className="space-y-8">
      {/* 顶部卡片区域 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Individual Knowledge */}
        <KnowledgeLevelChart
          data={individualKnowledge}
          title="Individual Knowledge"
        />

        {/* Team Knowledge */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-base font-semibold text-gray-800 mb-4 text-center">
            Team Knowledge
          </h3>

          {!hasCommitted ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
              <AlertCircle className="w-6 h-6 text-red-500 shrink-0" />
              <p className="text-sm text-red-700">
                You haven't committed your answer yet
              </p>
            </div>
          ) : !allSubmitted ? (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 flex items-center gap-3">
              <Hourglass className="w-5 h-5 text-purple-500 shrink-0" />
              <p className="text-sm text-purple-700">
                Status: Waiting for other members answers (missing:{" "}
                {missingCount})
              </p>
            </div>
          ) : (
            // 全员提交后显示团队汇总图表
            <KnowledgeLevelChart
              data={individualKnowledge} // TODO: 实际应合并所有成员数据
              title=""
            />
          )}
        </div>
      </div>

      {/* 颜色图例 */}
      <div className="flex flex-wrap items-center justify-center gap-4 py-4 bg-gray-50 rounded-lg border border-gray-200">
        {KNOWLEDGE_LEVELS.map((level) => (
          <div key={level} className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded-full border border-gray-300"
              style={{ backgroundColor: LEVEL_COLORS[level] }}
            />
            <span className="text-sm text-gray-700">{LEVEL_LABELS[level]}</span>
          </div>
        ))}
      </div>

      {/* 说明文字 */}
      <div className="space-y-4">
        <p className="text-sm text-gray-700">
          <span className="font-semibold">1.</span> Register your knowledge
          level according to the pre-defined categories. After completing the
          self-assessment, commit your results to the team.
        </p>

        {/* Individual Knowledge Summary + Commit 按钮 */}
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-gray-800">
            Individual Knowledge Summary
          </h4>
          <Button
            onClick={handleCommitToTeam}
            disabled={hasCommitted}
            className="px-4 py-2"
          >
            {hasCommitted ? "Committed" : "Commit to the team"}
          </Button>
        </div>

        {/* 知识水平选择表 */}
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold text-black">
                  Knowledge Domain
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-black">
                  Experience Level
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {KNOWLEDGE_DOMAINS.map((domain) => (
                <tr key={domain} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3 text-sm text-gray-800">
                    {domain
                      .replace(/-/g, " ")
                      .replace(/\b\w/g, (l: string) => l.toUpperCase())}
                  </td>
                  <td className="px-4 py-3">
                    <Select
                      value={individualKnowledge[domain] || "none"}
                      onValueChange={(value) =>
                        handleKnowledgeChange(domain, value)
                      }
                    >
                      <SelectTrigger className="w-full max-w-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {KNOWLEDGE_LEVELS.map((level) => (
                          <SelectItem key={level} value={level}>
                            <div className="flex items-center gap-2">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: LEVEL_COLORS[level] }}
                              />
                              {LEVEL_LABELS[level]}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 团队知识状态栏 */}
        {hasCommitted && (
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-700">
                <span className="font-semibold">Team Knowledge Summary:</span>{" "}
                {allSubmitted
                  ? "All members have submitted"
                  : `Waiting for ${missingCount} member${missingCount > 1 ? "s" : ""}`}
              </span>
            </div>
            {!allSubmitted && (
              <span className="text-xs text-purple-600 font-medium">
                {missingCount} pending
              </span>
            )}
          </div>
        )}
      </div>

      <TypingIndicator
        editingUsers={editingUsers}
        fieldName={`${fieldPrefix}-knowledge-assessment`}
      />
    </div>
  );
}

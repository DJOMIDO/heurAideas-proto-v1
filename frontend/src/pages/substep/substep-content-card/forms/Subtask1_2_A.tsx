// frontend/src/pages/substep/substep-content-card/forms/Subtask1_2_A.tsx

import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertCircle, Hourglass, CheckCircle2 } from "lucide-react";
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
  currentUserId?: number;
  teamSize?: number;
}

// 团队知识聚合：均值映射法 (Average Mapping)
const calculateTeamKnowledge = (
  submissions: Record<number, KnowledgeData>,
): KnowledgeData => {
  const teamData: KnowledgeData = {} as KnowledgeData;
  const levelToNum: Record<KnowledgeLevel, number> = {
    none: 0,
    low: 1,
    medium: 2,
    high: 3,
    "very-high": 4,
  };
  const numToLevel: KnowledgeLevel[] = [
    "none",
    "low",
    "medium",
    "high",
    "very-high",
  ];

  KNOWLEDGE_DOMAINS.forEach((domain) => {
    const values = Object.values(submissions)
      .map((sub) => levelToNum[sub[domain] || "none"])
      .filter((v) => !isNaN(v));

    if (values.length === 0) {
      teamData[domain] = "none";
      return;
    }

    const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
    teamData[domain] = numToLevel[Math.round(avg)] || "none";
  });

  return teamData;
};

export default function Subtask1_2_A({
  fieldPrefix,
  formData,
  onFormDataChange,
  editingUsers = {},
  currentUserId = 0,
  teamSize,
}: Subtask1_2_AProps) {
  // 1. 读取全局已提交数据
  const submissionsKey = `${fieldPrefix}-knowledge_submissions`;
  const submissions: Record<number, KnowledgeData> =
    (formData[submissionsKey] as Record<number, KnowledgeData>) || {};

  const mySubmission = submissions[currentUserId];
  const hasCommitted = !!mySubmission;

  // 2. 本地草稿状态（严格隔离：未提交前绝不触碰 formData）
  const [draftKnowledge, setDraftKnowledge] = useState<KnowledgeData>(() => {
    const init: KnowledgeData = {};
    // 优先加载已提交记录，否则初始化全为 none
    KNOWLEDGE_DOMAINS.forEach((d) => (init[d] = mySubmission?.[d] || "none"));
    return init;
  });

  // 3. 刷新/同步恢复逻辑
  useEffect(() => {
    if (mySubmission) {
      setDraftKnowledge(mySubmission);
    }
  }, [mySubmission]);

  // 当前展示的数据源：未提交读草稿，已提交读锁定数据
  const displayData = hasCommitted ? mySubmission : draftKnowledge;

  // 4. 团队聚合数据（实时计算）
  const teamKnowledge = useMemo(
    () => calculateTeamKnowledge(submissions),
    [submissions],
  );

  // 5. 状态统计
  const submittedCount = Object.keys(submissions).length;
  const missingCount = Math.max(0, (teamSize ?? 0) - submittedCount);
  const allSubmitted = (teamSize ?? 0) > 0 && missingCount === 0;

  // 6. 交互处理器
  const handleDraftChange = (domain: KnowledgeDomain, level: string) => {
    if (hasCommitted) return; // 已提交禁止修改
    setDraftKnowledge((prev) => ({
      ...prev,
      [domain]: level as KnowledgeLevel,
    }));
  };

  const handleCommitToTeam = () => {
    // 写入全局 formData，触发父组件自动保存 & WebSocket 广播
    onFormDataChange(submissionsKey, {
      ...submissions,
      [currentUserId]: {
        ...draftKnowledge,
        committedAt: new Date().toISOString(),
      },
    });
  };

  // 7. 表格渲染组件（支持只读/可编辑切换）
  const KnowledgeTable = ({
    data,
    readOnly = false,
  }: {
    data: KnowledgeData;
    readOnly?: boolean;
  }) => (
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
                  .replace(/\b\w/g, (l) => l.toUpperCase())}
              </td>
              <td className="px-4 py-3">
                <Select
                  value={data[domain] || "none"}
                  onValueChange={(v) => handleDraftChange(domain, v)}
                  disabled={readOnly}
                >
                  <SelectTrigger
                    className={`w-full max-w-xs ${readOnly ? "bg-gray-100 cursor-not-allowed" : ""}`}
                  >
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
  );

  // 8. 团队知识图表数据源（按需求三段式）
  const teamCardData = useMemo(() => {
    if (!hasCommitted) return null;
    return allSubmitted ? teamKnowledge : mySubmission;
  }, [hasCommitted, allSubmitted, teamKnowledge, mySubmission]);

  return (
    <div className="space-y-6">
      {/* 顶部双卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Individual Knowledge */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-base font-semibold text-gray-800 mb-4 text-center">
            Individual Knowledge
          </h3>
          <KnowledgeLevelChart
            data={displayData}
            title="Individual Knowledge"
          />
        </div>

        {/* Team Knowledge (三段式状态机) */}
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
          ) : (
            // 已提交：显示对应图表（部分提交显示个人，全员提交显示团队）
            <KnowledgeLevelChart
              data={teamCardData || {}}
              title={
                allSubmitted
                  ? "Aggregated Team Knowledge"
                  : "Your Submitted Knowledge"
              }
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

      {/* 说明与操作区 */}
      <div className="space-y-4">
        <p className="text-sm text-gray-700">
          <span className="font-semibold">1. </span> Register your knowledge
          level according to the pre-defined categories. After completing the
          self-assessment, commit your results to the team.
        </p>

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

        {/* 主表格（未提交可编辑，提交后只读锁定） */}
        <KnowledgeTable data={displayData} readOnly={hasCommitted} />

        {/* 底部团队知识状态栏 & 详情表（严格按需求条件渲染） */}
        {hasCommitted && (
          <div className="space-y-3 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center gap-2">
                {allSubmitted ? (
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                ) : (
                  <Hourglass className="w-5 h-5 text-purple-500 shrink-0" />
                )}
                <span className="text-sm text-gray-700">
                  <span className="font-semibold">
                    Team Knowledge Summary:{" "}
                  </span>{" "}
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

            {/* 条件渲染详情表：未全员显示我的，全员显示团队聚合 */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h5 className="text-sm font-semibold text-gray-800 mb-3">
                {allSubmitted
                  ? "Aggregated Team Knowledge"
                  : "Your Submitted Knowledge"}
              </h5>
              <KnowledgeTable
                data={allSubmitted ? teamKnowledge : mySubmission}
                readOnly={true}
              />
            </div>
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

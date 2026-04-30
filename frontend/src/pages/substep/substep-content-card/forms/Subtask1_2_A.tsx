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
  // 🔑 核心：必须传入当前用户 ID 与团队总人数，否则无法隔离
  currentUserId: number;
  teamSize: number;
}

// 🔑 团队知识聚合：均值映射法 (Average Mapping)
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
  currentUserId,
  teamSize,
}: Subtask1_2_AProps) {
  //  1. 读取全局已提交数据（按用户 ID 隔离存储）
  const submissionsKey = `${fieldPrefix}-knowledge_submissions`;
  const submissions: Record<number, KnowledgeData> =
    (formData[submissionsKey] as Record<number, KnowledgeData>) || {};

  const mySubmission = submissions[currentUserId];
  const hasCommitted = !!mySubmission;

  // 2. 本地草稿状态（严格隔离：未提交前绝不触碰 formData）
  const [draftKnowledge, setDraftKnowledge] = useState<KnowledgeData>(() => {
    const init: KnowledgeData = {};
    KNOWLEDGE_DOMAINS.forEach((d) => (init[d] = mySubmission?.[d] || "none"));
    return init;
  });

  //  3. 刷新/同步恢复：仅当远程提交数据到达时，覆盖本地草稿
  useEffect(() => {
    if (mySubmission?.committedAt) {
      if (draftKnowledge.committedAt !== mySubmission.committedAt) {
        setDraftKnowledge(mySubmission);
      }
    }
  }, [mySubmission?.committedAt]);

  // 4. 交互处理器：仅更新本地草稿，不调用 onFormDataChange（彻底隔离）
  const handleDraftChange = (domain: KnowledgeDomain, level: string) => {
    if (hasCommitted) return; // 已提交禁止修改
    setDraftKnowledge((prev) => ({
      ...prev,
      [domain]: level as KnowledgeLevel,
    }));
  };

  // 5. 提交逻辑：一次性将草稿写入全局 formData 的专属槽位
  const handleCommitToTeam = () => {
    // 添加 _committed 标记，防止被 cleanupEmptyFormDataFields 清理
    const submissionData = {
      ...draftKnowledge,
      committedAt: new Date().toISOString(),
      _committed: true, // 永远非空的标记字段
    };

    onFormDataChange(submissionsKey, {
      ...submissions,
      [currentUserId]: submissionData,
    });
  };

  // 6. 数据源计算
  const displayData = hasCommitted ? mySubmission : draftKnowledge;
  const teamKnowledge = useMemo(
    () => calculateTeamKnowledge(submissions),
    [submissions],
  );
  const submittedCount = Object.keys(submissions).length;
  const missingCount = Math.max(0, teamSize - submittedCount);
  const allSubmitted = teamSize > 0 && missingCount === 0;

  // 7. 表格组件（支持只读锁定）
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

  return (
    <div className="space-y-6">
      {/* 顶部双卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Individual Knowledge */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-base font-semibold text-gray-800 mb-4 text-center">
            Individual Knowledge
          </h3>
          <KnowledgeLevelChart data={displayData} title="" />
        </div>

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
          ) : (
            <KnowledgeLevelChart
              data={allSubmitted ? teamKnowledge : mySubmission}
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

      {/* 说明与操作区 */}
      <div className="space-y-4">
        <p className="text-sm text-gray-700">
          <span className="font-semibold">1. </span> Register your knowledge
          level according to the pre-defined categories. After completing the
          self-assessment, commit your results to the team.
        </p>

        {/* Individual Knowledge Summary + Commit 按钮（带外层包装） */}
        <div className="space-y-3 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border border-gray-200">
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
          <KnowledgeTable data={displayData} readOnly={hasCommitted} />
        </div>

        {/* 底部团队知识状态栏 & 详情表 */}
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

            <KnowledgeTable
              data={allSubmitted ? teamKnowledge : mySubmission}
              readOnly={true}
            />
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

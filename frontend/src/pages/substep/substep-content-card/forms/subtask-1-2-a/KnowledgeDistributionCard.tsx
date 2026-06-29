// frontend/src/pages/substep/substep-content-card/forms/subtask-1-2-a/KnowledgeDistributionCard.tsx

import type {
  KnowledgeDomain,
  KnowledgeLevel,
  MethodologicalFreedomData,
} from "./types";
import {
  KNOWLEDGE_LEVELS,
  LEVEL_COLORS,
  LEVEL_LABELS,
} from "./types";
import DistributionRow from "./DistributionRow";

export interface SubmissionData {
  "heuristics-evaluation": KnowledgeLevel;
  "soi": KnowledgeLevel;
  "systems-engineering": KnowledgeLevel;
  "interaction-design": KnowledgeLevel;
  "inspected-criteria": KnowledgeLevel;
  freedom?: MethodologicalFreedomData;
  committedAt: string;
  username?: string;
}

interface KnowledgeDistributionCardProps {
  domain: KnowledgeDomain;
  domainTitle: string;
  submissions: Record<number, SubmissionData>;
  teamSize: number;
}

export default function KnowledgeDistributionCard({
  domain,
  domainTitle,
  submissions,
  teamSize,
}: KnowledgeDistributionCardProps) {
  const distribution = KNOWLEDGE_LEVELS.map((level) => {
    const users = Object.entries(submissions)
      .filter(([, data]) => data[domain] === level)
      .map(([userId, data]) => ({
        id: Number(userId),
        username: data.username || `User ${userId}`,
      }));

    return {
      level,
      count: users.length,
      users,
    };
  });

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5">
      <h3 className="text-base font-semibold text-gray-800 mb-4">
        {domainTitle} - Distribution
      </h3>
      <div className="space-y-1">
        {distribution.map(({ level, count, users }) => (
          <DistributionRow
            key={level}
            label={LEVEL_LABELS[level]}
            color={LEVEL_COLORS[level]}
            count={count}
            total={teamSize}
            users={users}
          />
        ))}
      </div>
    </div>
  );
}

// frontend/src/pages/substep/substep-content-card/forms/subtask-1-2-a/FreedomDistributionCard.tsx
import {
  METHODOLOGICAL_FREEDOM_QUESTIONS,
  METHODOLOGICAL_FREEDOM_LABELS,
} from "./types";
import DistributionRow from "./DistributionRow";
import type { SubmissionData } from "./KnowledgeDistributionCard";

interface FreedomDistributionCardProps {
  submissions: Record<number, SubmissionData>;
  teamSize: number;
}

export default function FreedomDistributionCard({
  submissions,
  teamSize,
}: FreedomDistributionCardProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5">
      <h3 className="text-base font-semibold text-gray-800 mb-4">
        Methodological Freedom
      </h3>
      <div className="space-y-6">
        {METHODOLOGICAL_FREEDOM_QUESTIONS.map((question) => {
          const yesUsers = Object.entries(submissions)
            .filter(([, data]) => data.freedom?.[question] === "yes")
            .map(([userId, data]) => ({
              id: Number(userId),
              username: data.username || `User ${userId}`,
            }));

          return (
            <div key={question} className="space-y-2">
              <p className="text-sm font-medium text-gray-700">
                {METHODOLOGICAL_FREEDOM_LABELS[question].title}
              </p>

              <DistributionRow
                label="Yes"
                color="#22c55e"
                count={yesUsers.length}
                total={teamSize}
                users={yesUsers}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

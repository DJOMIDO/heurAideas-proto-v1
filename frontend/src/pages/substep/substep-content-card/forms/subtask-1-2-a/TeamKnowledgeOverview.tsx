// frontend/src/pages/substep/substep-content-card/forms/subtask-1-2-a/TeamKnowledgeOverview.tsx
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import type { KnowledgeData, KnowledgeDomain } from "./types";
import { KNOWLEDGE_DOMAINS, DOMAIN_TITLES } from "./types";
import KnowledgeDistributionCard from "./KnowledgeDistributionCard";
import FreedomDistributionCard from "./FreedomDistributionCard";
import KnowledgeSummaryCharts from "./KnowledgeSummaryCharts";
import { calculateTeamKnowledge } from "../Subtask1_2_A";
import type { SubmissionData } from "./KnowledgeDistributionCard";

interface TeamKnowledgeOverviewProps {
  submissions: Record<number, SubmissionData>;
  teamSize: number;
  currentUserId: number;
  onBack: () => void;
}

export default function TeamKnowledgeOverview({
  submissions,
  teamSize,
  currentUserId,
  onBack,
}: TeamKnowledgeOverviewProps) {
  const [selectedDomain, setSelectedDomain] = useState<KnowledgeDomain>(
    KNOWLEDGE_DOMAINS[0],
  );

  const submittedCount = Object.keys(submissions).length;
  const individualData = submissions[currentUserId] || ({} as KnowledgeData);
  const teamData = useMemo(
    () => calculateTeamKnowledge(submissions),
    [submissions],
  );

  return (
    <div className="space-y-6">
      <KnowledgeSummaryCharts
        individualData={individualData}
        teamData={teamData}
        hasCommitted={true}
      />

      <h2 className="text-2xl font-bold text-gray-900">
        Team Knowledge Overview
      </h2>

      <div>
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
          Select Knowledge
        </h3>
        <div className="flex flex-wrap gap-2">
          {KNOWLEDGE_DOMAINS.map((domain) => (
            <button
              key={domain}
              onClick={() => setSelectedDomain(domain)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                selectedDomain === domain
                  ? "bg-gray-900 text-white"
                  : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
              }`}
            >
              {DOMAIN_TITLES[domain]}
            </button>
          ))}
        </div>
      </div>

      <KnowledgeDistributionCard
        domain={selectedDomain}
        domainTitle={DOMAIN_TITLES[selectedDomain]}
        submissions={submissions}
        teamSize={teamSize}
      />

      <FreedomDistributionCard submissions={submissions} teamSize={teamSize} />

      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <p className="text-sm text-gray-600">
          {submittedCount} of {teamSize} participants completed
        </p>
        <Button
          variant="outline"
          onClick={onBack}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
      </div>
    </div>
  );
}

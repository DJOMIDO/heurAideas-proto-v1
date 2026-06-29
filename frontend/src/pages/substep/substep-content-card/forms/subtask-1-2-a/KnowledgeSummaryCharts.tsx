// frontend/src/pages/substep/substep-content-card/forms/subtask-1-2-a/KnowledgeSummaryCharts.tsx

import KnowledgeLevelChart from "./KnowledgeLevelChart";
import { AlertCircle } from "lucide-react";
import { KNOWLEDGE_LEVELS, LEVEL_COLORS, LEVEL_LABELS } from "./types";

interface KnowledgeSummaryChartsProps {
  individualData: Record<string, any>;
  teamData: Record<string, any>;
  hasCommitted: boolean;
}

export default function KnowledgeSummaryCharts({
  individualData,
  teamData,
  hasCommitted,
}: KnowledgeSummaryChartsProps) {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-base font-semibold text-gray-800 mb-4 text-center">
            Individual Knowledge
          </h3>
          <KnowledgeLevelChart data={individualData} title="" />
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-base font-semibold text-gray-800 mb-4 text-center">
            Team Knowledge
          </h3>
          {!hasCommitted ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3 h-[300px]">
              <AlertCircle className="w-6 h-6 text-red-500 shrink-0" />
              <p className="text-sm text-red-700">
                You haven't submitted your answer yet
              </p>
            </div>
          ) : (
            <KnowledgeLevelChart data={teamData} title="" />
          )}
        </div>
      </div>

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
    </>
  );
}

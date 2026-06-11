// frontend/src/pages/substep/substep-content-card/forms/Subtask1_2_A.tsx
import { useState, useMemo, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Hourglass, CheckCircle2, ArrowRight, Eye, Save } from "lucide-react";
import { toast } from "sonner";
import TypingIndicator from "@/components/TypingIndicator";
import KnowledgeDomainCard from "./subtask-1-2-a/KnowledgeDomainCard";
import MethodologicalFreedomCard from "./subtask-1-2-a/MethodologicalFreedomCard";
import TeamKnowledgeOverview from "./subtask-1-2-a/TeamKnowledgeOverview";
import KnowledgeSummaryCharts from "./subtask-1-2-a/KnowledgeSummaryCharts";
import type {
  KnowledgeData,
  KnowledgeDomain,
  KnowledgeLevel,
  MethodologicalFreedomType,
  MethodologicalFreedomData,
} from "./subtask-1-2-a/types";
import {
  KNOWLEDGE_DOMAINS,
  DOMAIN_TITLES,
  METHODOLOGICAL_FREEDOM_QUESTIONS,
} from "./subtask-1-2-a/types";
import type { SubmissionData } from "./subtask-1-2-a/KnowledgeDistributionCard";

interface Subtask1_2_AProps {
  fieldPrefix: string;
  formData: Record<string, any>;
  onFormDataChange: (field: string, value: any) => void;
  editingUsers?: Record<
    string,
    { userId: number; username: string; timestamp: string }
  >;
  currentUserId: number;
  teamSize: number;
  userInfo?: { name: string } | null;
  substepId?: string;
  projectId?: number;
  sendMessage?: (message: any) => void;
  onSyncAndSave?: (key: string, value: any) => void;
  onManualSave?: () => Promise<void>;
}

export const calculateTeamKnowledge = (
  submissions: Record<number, SubmissionData>,
): KnowledgeData => {
  const teamData: KnowledgeData = {} as KnowledgeData;
  const levelToNum: Record<KnowledgeLevel, number> = {
    none: 0,
    "very-low": 0.5,
    low: 1,
    medium: 2,
    high: 3,
    "very-high": 4,
  };

  KNOWLEDGE_DOMAINS.forEach((domain) => {
    const values = Object.values(submissions)
      .map((sub) => levelToNum[sub[domain] || "none"])
      .filter((v) => !isNaN(v));

    if (values.length === 0) {
      teamData[domain] = "none";
      return;
    }

    const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
    const rounded = Math.round(avg * 2) / 2;

    let finalLevel: KnowledgeLevel = "none";
    if (rounded <= 0.25) finalLevel = "none";
    else if (rounded <= 0.75) finalLevel = "very-low";
    else if (rounded <= 1.5) finalLevel = "low";
    else if (rounded <= 2.5) finalLevel = "medium";
    else if (rounded <= 3.5) finalLevel = "high";
    else finalLevel = "very-high";

    teamData[domain] = finalLevel;
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
  userInfo,
  onSyncAndSave,
  onManualSave,
}: Subtask1_2_AProps) {
  const submissionsKey = `${fieldPrefix}-knowledge_submissions`;
  const draftKey = `${fieldPrefix}-personal_draft_${currentUserId}`;

  const submissions: Record<number, SubmissionData> =
    (formData[submissionsKey] as Record<number, SubmissionData>) || {};
  const mySubmission = submissions[currentUserId];
  const draftData =
    (formData[draftKey] as {
      knowledge?: KnowledgeData;
      comments?: Record<string, string>;
      freedom?: MethodologicalFreedomData;
    }) || {};

  const prevSubmissionsRef =
    useRef<Record<number, SubmissionData>>(submissions);

  const [hasCommitted, setHasCommitted] = useState(!!mySubmission?.committedAt);
  const [showOverview, setShowOverview] = useState(false);
  const [draftKnowledge, setDraftKnowledge] = useState<KnowledgeData>(() => {
    const init: KnowledgeData = {};
    KNOWLEDGE_DOMAINS.forEach((d) => {
      init[d] = draftData.knowledge?.[d] || mySubmission?.[d] || "none";
    });
    return init;
  });
  const [draftComments, setDraftComments] = useState<Record<string, string>>(
    draftData.comments || {},
  );
  const [draftFreedom, setDraftFreedom] = useState<MethodologicalFreedomData>(
    draftData.freedom || mySubmission?.freedom || {},
  );

  useEffect(() => {
    if (mySubmission?.committedAt) setHasCommitted(true);
  }, [mySubmission?.committedAt]);

  useEffect(() => {
    const prevSubmissions = prevSubmissionsRef.current;
    const currSubmissions = submissions;

    Object.keys(currSubmissions).forEach((userIdStr) => {
      const userId = Number(userIdStr);

      if (userId === currentUserId) return;

      const prevData = prevSubmissions[userId];
      const currData = currSubmissions[userId];

      if (!prevData?.committedAt && currData?.committedAt) {
        const submitterName = currData.username || `User ${userId}`;
        toast.success(
          `${submitterName} has submitted their knowledge assessment.`,
        );
      }
    });

    prevSubmissionsRef.current = currSubmissions;
  }, [submissions, currentUserId]);

  const handleKnowledgeChange = (
    domain: KnowledgeDomain,
    level: KnowledgeLevel,
  ) => {
    if (hasCommitted) return;
    const newKnowledge = { ...draftKnowledge, [domain]: level };
    setDraftKnowledge(newKnowledge);
    saveDraft(newKnowledge, draftComments, draftFreedom);
  };

  const handleCommentChange = (domain: string, comment: string) => {
    if (hasCommitted) return;
    const newComments = { ...draftComments, [domain]: comment };
    setDraftComments(newComments);
    saveDraft(draftKnowledge, newComments, draftFreedom);
  };

  const handleFreedomChange = (
    type: MethodologicalFreedomType,
    value: "yes" | "no",
  ) => {
    if (hasCommitted) return;
    const newFreedom = { ...draftFreedom, [type]: value };
    setDraftFreedom(newFreedom);
    saveDraft(draftKnowledge, draftComments, newFreedom);
  };

  const saveDraft = (
    knowledge: KnowledgeData,
    comments: Record<string, string>,
    freedom: MethodologicalFreedomData,
  ) => {
    onFormDataChange(draftKey, { knowledge, comments, freedom });
  };

  const handleSubmit = async () => {
    if (hasCommitted) return;
    try {
      // 先强制保存本地所有未保存的更改（防止自己的 comment 在拉取后端时被覆盖丢失）
      if (onManualSave) {
        await onManualSave();
      }

      setHasCommitted(true);
      const submissionData = {
        ...draftKnowledge,
        freedom: draftFreedom,
        committedAt: new Date().toISOString(),
        username: userInfo?.name || `User ${currentUserId}`,
      } as SubmissionData;

      const mergedSubmissions = {
        ...submissions,
        [currentUserId]: submissionData,
      };

      if (onSyncAndSave) {
        await onSyncAndSave(submissionsKey, mergedSubmissions);
      } else {
        onFormDataChange(submissionsKey, mergedSubmissions);
      }

      toast.success("Knowledge assessment submitted successfully!");
    } catch (error) {
      console.error("Submit failed:", error);
      toast.error("Failed to submit. Please try again.");
    }
  };

  const handleUnsubmit = async () => {
    if (!hasCommitted) return;
    try {
      setHasCommitted(false);
      setShowOverview(false);

      const { [currentUserId]: _, ...rest } = submissions;

      if (onSyncAndSave) {
        await onSyncAndSave(submissionsKey, rest);
      } else {
        onFormDataChange(submissionsKey, rest);
      }

      toast.success("Submission withdrawn.");
    } catch (error) {
      console.error("Unsubmit failed:", error);
      toast.error("Failed to withdraw submission.");
    }
  };

  const handleSave = () => {
    try {
      saveDraft(draftKnowledge, draftComments, draftFreedom);
      toast.success("Draft saved successfully.");
    } catch (error) {
      console.error("Save failed:", error);
      toast.error("Failed to save draft.");
    }
  };

  const displayData: Record<string, any> =
    (hasCommitted && mySubmission ? mySubmission : draftKnowledge) ||
    draftKnowledge;

  const teamKnowledge = useMemo(
    () => calculateTeamKnowledge(submissions),
    [submissions],
  );
  const submittedCount = Object.keys(submissions).length;
  const missingCount = Math.max(0, teamSize - submittedCount);
  const allSubmitted = teamSize > 0 && missingCount === 0;

  if (showOverview && hasCommitted) {
    return (
      <div className="space-y-6">
        <TeamKnowledgeOverview
          submissions={submissions}
          teamSize={teamSize}
          onBack={() => setShowOverview(false)}
          currentUserId={currentUserId}
        />
        <TypingIndicator
          editingUsers={editingUsers}
          fieldName={`${fieldPrefix}-knowledge-assessment`}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <KnowledgeSummaryCharts
        individualData={displayData}
        teamData={allSubmitted ? teamKnowledge : displayData}
        hasCommitted={hasCommitted}
      />

      <p className="text-sm text-gray-700">
        <span className="font-semibold">1.</span> Evaluate your knowledge level
        for each domain by referring to the descriptors below. Share your
        results with the team once completed.
      </p>

      <div className="space-y-4">
        <h2 className="text-lg font-bold text-gray-900 uppercase tracking-wide">
          Personal Knowledge
        </h2>
        {KNOWLEDGE_DOMAINS.map((domain) => (
          <KnowledgeDomainCard
            key={domain}
            domain={domain}
            title={DOMAIN_TITLES[domain]}
            value={draftKnowledge[domain] || "none"}
            onChange={(level: KnowledgeLevel) =>
              handleKnowledgeChange(domain, level)
            }
            comment={draftComments[domain] || ""}
            onCommentChange={(comment: string) =>
              handleCommentChange(domain, comment)
            }
            isReadOnly={hasCommitted}
          />
        ))}
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-bold text-gray-900 uppercase tracking-wide">
          Methodological Freedom
        </h2>
        {METHODOLOGICAL_FREEDOM_QUESTIONS.map((type) => (
          <MethodologicalFreedomCard
            key={type}
            questionType={type}
            value={draftFreedom[type]}
            onChange={(val: "yes" | "no") => handleFreedomChange(type, val)}
            isReadOnly={hasCommitted}
          />
        ))}
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
        {hasCommitted ? (
          <>
            <Button
              variant="outline"
              onClick={handleUnsubmit}
              className="px-6 py-2 text-sm font-medium"
            >
              Unsubmit
            </Button>
            <Button
              onClick={() => setShowOverview(true)}
              className="px-6 py-2 text-sm font-medium bg-gray-900 hover:bg-gray-800 text-white flex items-center gap-2"
            >
              See detailed results <Eye className="w-4 h-4" />
            </Button>
          </>
        ) : (
          <>
            <Button
              variant="outline"
              onClick={handleSave}
              className="px-6 py-2 text-sm font-medium"
            >
              <Save className="w-4 h-4" />
              Save
            </Button>
            <Button
              onClick={handleSubmit}
              className="px-6 py-2 text-sm font-medium bg-gray-900 hover:bg-gray-800 text-white flex items-center gap-2"
            >
              Submit <ArrowRight className="w-4 h-4" />
            </Button>
          </>
        )}
      </div>

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
                <span className="font-semibold">Team Knowledge Summary:</span>{" "}
                {allSubmitted
                  ? "All members have submitted"
                  : `Waiting for ${missingCount} member${missingCount > 1 ? "s" : ""}`}
              </span>
            </div>
          </div>
        </div>
      )}

      <TypingIndicator
        editingUsers={editingUsers}
        fieldName={`${fieldPrefix}-knowledge-assessment`}
      />
    </div>
  );
}

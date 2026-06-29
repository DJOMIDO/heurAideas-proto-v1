// frontend/src/pages/substep/substep-content-card/forms/Subtask1_3_C.tsx

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Eye, ArrowRight } from "lucide-react";
import TypingIndicator from "@/components/TypingIndicator";
import FieldSelector from "./subtask-1-3-c/FieldSelector";
import GranularitySelector from "./subtask-1-3-c/GranularitySelector";
import TemplateSelector from "./subtask-1-3-c/TemplateSelector";
import LivePreview from "./subtask-1-3-c/LivePreview";
import HeuristicsFormatSummary from "./subtask-1-3-c/HeuristicsFormatSummary";
import TeamVotingStatus from "./subtask-1-3-c/TeamVotingStatus";
import type {
  RequiredField,
  Granularity,
  Template,
  HeuristicsFormatData,
  SubmissionData,
} from "./subtask-1-3-c/types";

interface Subtask1_3_CProps {
  fieldPrefix: string;
  formData: Record<string, any>;
  onFormDataChange: (field: string, value: any) => void;
  editingUsers?: Record<
    string,
    { userId: number; username: string; timestamp: string }
  >;
  currentUserId: number;
  teamSize: number;
  teamMembers?: Array<{
    user_username: string;
    user_id: any;
    id: number;
    username: string;
    email?: string;
  }>;
  userInfo?: { name: string } | null;
  substepId?: string;
  projectId?: number;
  sendMessage?: (message: any) => void;
  onSyncAndSave?: (key: string, value: any) => void;
}

export default function Subtask1_3_C({
  fieldPrefix,
  formData,
  onFormDataChange,
  editingUsers = {},
  currentUserId,
  teamSize,
  teamMembers = [],
  userInfo,
  onSyncAndSave,
}: Subtask1_3_CProps) {
  const submissionsKey = `${fieldPrefix}-heuristics_format_submissions`;
  const draftKey = `${fieldPrefix}-personal_draft_${currentUserId}`;

  const submissions: Record<number, SubmissionData> =
    (formData[submissionsKey] as Record<number, SubmissionData>) || {};
  const mySubmission = submissions[currentUserId];
  const draftData =
    (formData[draftKey] as {
      heuristicsFormat?: HeuristicsFormatData;
    }) || {};

  const [hasCommitted, setHasCommitted] = useState(!!mySubmission?.committedAt);
  const [showOverview, setShowOverview] = useState(false);

  const [draftFormat, setDraftFormat] = useState<HeuristicsFormatData>(() => {
    return (
      draftData.heuristicsFormat ||
      mySubmission?.heuristicsFormat || {
        requiredFields: [],
        granularity: null,
        template: null,
      }
    );
  });

  const hasNotifiedRef = useRef(false);
  useEffect(() => {
    const submittedCount = Object.keys(submissions).length;
    if (
      submittedCount === teamSize &&
      teamSize > 0 &&
      !hasNotifiedRef.current
    ) {
      toast.success(
        "All participants have voted! The synthesis session is ready.",
      );
      hasNotifiedRef.current = true;
    }
    if (submittedCount < teamSize && hasNotifiedRef.current) {
      hasNotifiedRef.current = false;
    }
  }, [submissions, teamSize]);

  useEffect(() => {
    if (mySubmission?.committedAt) setHasCommitted(true);
  }, [mySubmission?.committedAt]);

  const handleFieldToggle = (field: RequiredField) => {
    if (hasCommitted) return;
    const newFields = draftFormat.requiredFields.includes(field)
      ? draftFormat.requiredFields.filter((f) => f !== field)
      : [...draftFormat.requiredFields, field];
    const newFormat = { ...draftFormat, requiredFields: newFields };
    setDraftFormat(newFormat);
    saveDraft(newFormat);
  };

  const handleGranularityChange = (value: Granularity) => {
    if (hasCommitted) return;
    const newFormat = { ...draftFormat, granularity: value };
    setDraftFormat(newFormat);
    saveDraft(newFormat);
  };

  const handleTemplateChange = (value: Template) => {
    if (hasCommitted) return;
    const newFormat = { ...draftFormat, template: value };
    setDraftFormat(newFormat);
    saveDraft(newFormat);
  };

  const saveDraft = (format: HeuristicsFormatData) => {
    onFormDataChange(draftKey, { heuristicsFormat: format });
  };

  const handleSubmit = async () => {
    if (hasCommitted) return;
    try {
      setHasCommitted(true);
      const submissionData: SubmissionData = {
        heuristicsFormat: draftFormat,
        committedAt: new Date().toISOString(),
        username: userInfo?.name || `User ${currentUserId}`,
      };

      const mergedSubmissions = {
        ...submissions,
        [currentUserId]: submissionData,
      };

      if (onSyncAndSave) {
        await onSyncAndSave(submissionsKey, mergedSubmissions);
      } else {
        onFormDataChange(submissionsKey, mergedSubmissions);
      }

      toast.success("Your choices have been saved successfully!");
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

      toast.success("Submission withdrawn. You can modify your votes.");
    } catch (error) {
      console.error("Unsubmit failed:", error);
      toast.error("Failed to withdraw submission.");
    }
  };

  if (showOverview && hasCommitted && mySubmission) {
    const submittedUserIds = new Set(Object.keys(submissions).map(Number));

    const allMembers =
      teamMembers.length > 0
        ? teamMembers.map((member) => ({
            id: member.user_id,
            username: member.user_username || `User ${member.user_id}`,
            submitted: submittedUserIds.has(member.user_id),
          }))
        : Object.entries(submissions).map(([userId, data]) => ({
            id: Number(userId),
            username: data.username || `User ${userId}`,
            submitted: true,
          }));

    return (
      <div className="space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-gray-900">
            Your choices have been saved
          </h2>
          <p className="text-sm text-gray-600">
            You will be notified as soon as all participants have voted.
          </p>
        </div>

        <HeuristicsFormatSummary
          requiredFields={mySubmission.heuristicsFormat.requiredFields}
          granularity={mySubmission.heuristicsFormat.granularity}
          template={mySubmission.heuristicsFormat.template}
        />

        {mySubmission?.committedAt && (
          <p className="text-xs text-gray-500 text-center">
            Submitted on {new Date(mySubmission.committedAt).toLocaleString()}
          </p>
        )}

        <TeamVotingStatus
          members={allMembers}
          teamSize={teamMembers.length || teamSize}
        />

        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={() => setShowOverview(false)}
            className="px-6 py-2"
          >
            ← Modify my votes
          </Button>
        </div>

        <TypingIndicator
          editingUsers={editingUsers}
          fieldName={`${fieldPrefix}-heuristics-format`}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
                Required Fields
              </h3>
              <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-xs text-gray-600">
                ?
              </div>
            </div>
            <p className="text-xs text-gray-600">
              What fields should each heuristic contain?
            </p>
            <FieldSelector
              selectedFields={draftFormat.requiredFields}
              onToggle={handleFieldToggle}
              isReadOnly={hasCommitted}
            />
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide flex items-center gap-2">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
                Granularity
              </h3>
              <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-xs text-gray-600">
                ?
              </div>
            </div>
            <p className="text-xs text-gray-600">
              Expected level of detail per heuristic
            </p>
            <GranularitySelector
              value={draftFormat.granularity}
              onChange={handleGranularityChange}
              isReadOnly={hasCommitted}
            />
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide flex items-center gap-2">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
                Writing Template
              </h3>
              <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-xs text-gray-600">
                ?
              </div>
            </div>
            <p className="text-xs text-gray-600">Verbal form of the template</p>
            <TemplateSelector
              value={draftFormat.template}
              onChange={handleTemplateChange}
              isReadOnly={hasCommitted}
            />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4 flex items-center gap-2">
            <svg
              className="w-4 h-4 text-emerald-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
            Live Preview
          </h3>
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <LivePreview
              requiredFields={draftFormat.requiredFields}
              granularity={draftFormat.granularity}
              template={draftFormat.template}
            />
          </div>
        </div>
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
              onClick={handleSubmit}
              disabled={
                draftFormat.requiredFields.length === 0 ||
                !draftFormat.granularity ||
                !draftFormat.template
              }
              className="px-6 py-2 text-sm font-medium bg-gray-900 hover:bg-gray-800 text-white flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Submit my votes <ArrowRight className="w-4 h-4" />
            </Button>
          </>
        )}
      </div>

      <TypingIndicator
        editingUsers={editingUsers}
        fieldName={`${fieldPrefix}-heuristics-format`}
      />
    </div>
  );
}

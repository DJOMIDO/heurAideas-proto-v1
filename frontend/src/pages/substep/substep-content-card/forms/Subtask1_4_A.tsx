// frontend/src/pages/substep/substep-content-card/forms/Subtask1_4_A.tsx

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { ArrowRight, Users, BookOpen, DollarSign, Clock } from "lucide-react";
import TypingIndicator from "@/components/TypingIndicator";
import ResourceSection from "./subtask-1-4-a/ResourceSection";
import LevelSelectionCard from "./subtask-1-4-a/LevelSelectionCard";
import OptionalTextInput from "./subtask-1-4-a/OptionalTextInput";
import type { ResourcesData, SubmissionData } from "./subtask-1-4-a/types";
import DocumentLinkField from "@/components/DocumentSelector/DocumentLinkField";

interface Subtask1_4_AProps {
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
}

const createInitialData = (): ResourcesData => ({
  endUsers: { level: null, comment: "" },
  domainExperts: { level: null, comment: "" },
  heInspectors: { count: null, comment: "" },
  scientificDatabases: { level: null, comment: "" },
  domainDocumentation: { level: null, comment: "" },
  projectDocumentation: { documents: [] },
  financialLatitude: { level: null, comment: "" },
  availableTools: { tools: "" },
  timeline: { level: null, comment: "" },
});

export default function Subtask1_4_A({
  fieldPrefix,
  formData,
  onFormDataChange,
  editingUsers = {},
  currentUserId,
  projectId,
  userInfo,
  onSyncAndSave,
}: Subtask1_4_AProps) {
  const submissionsKey = `${fieldPrefix}-resources_submissions`;
  const draftKey = `${fieldPrefix}-personal_draft_${currentUserId}`;

  const submissions: Record<number, SubmissionData> =
    (formData[submissionsKey] as Record<number, SubmissionData>) || {};
  const mySubmission = submissions[currentUserId];
  const draftData = (formData[draftKey] as { resources?: ResourcesData }) || {};

  const [hasCommitted, setHasCommitted] = useState(!!mySubmission?.committedAt);

  const [resources, setResources] = useState<ResourcesData>(() => {
    const initialData = createInitialData();
    const { committedAt, username, ...restOfSubmission } = mySubmission || {};
    return {
      ...initialData,
      ...draftData.resources,
      ...restOfSubmission,
    };
  });

  useEffect(() => {
    if (mySubmission?.committedAt) setHasCommitted(true);
  }, [mySubmission?.committedAt]);

  const saveDraft = (data: ResourcesData) => {
    onFormDataChange(draftKey, { resources: data });
  };

  const updateField = <K extends keyof ResourcesData>(
    field: K,
    value: ResourcesData[K],
  ) => {
    if (hasCommitted) {
      toast.error("Cannot edit after submission.");
      return;
    }

    setResources((prev) => {
      const newData = { ...prev, [field]: value };
      saveDraft(newData);
      return newData;
    });
  };

  const handleSubmit = async () => {
    if (hasCommitted) return;
    try {
      setHasCommitted(true);
      const submissionData: SubmissionData = {
        ...resources,
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

      toast.success("Resources assessment submitted successfully!");
    } catch (error) {
      console.error("Submit failed:", error);
      toast.error("Failed to submit. Please try again.");
    }
  };

  const handleUnsubmit = async () => {
    if (!hasCommitted) return;
    try {
      setHasCommitted(false);
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

  return (
    <div className="space-y-6">
      <ResourceSection
        title="Stakeholders"
        icon={<Users className="w-5 h-5 text-gray-600" />}
      >
        <LevelSelectionCard
          title="End-users"
          description="Final users — operators, practitioners, direct users"
          selectedLevel={resources.endUsers.level}
          onSelect={(level) =>
            updateField("endUsers", { ...resources.endUsers, level })
          }
          isReadOnly={hasCommitted}
        />
        <OptionalTextInput
          placeholder="Specify profile and availability of end-users..."
          value={resources.endUsers.comment}
          onChange={(comment) =>
            updateField("endUsers", { ...resources.endUsers, comment })
          }
          isReadOnly={hasCommitted}
        />

        <div className="border-t border-gray-200 pt-6">
          <LevelSelectionCard
            title="Domain Experts"
            description="Engineers, designers, domain specialists"
            selectedLevel={resources.domainExperts.level}
            onSelect={(level) =>
              updateField("domainExperts", {
                ...resources.domainExperts,
                level,
              })
            }
            isReadOnly={hasCommitted}
          />
          <OptionalTextInput
            placeholder="Specify expert profiles and their role in the project..."
            value={resources.domainExperts.comment}
            onChange={(comment) =>
              updateField("domainExperts", {
                ...resources.domainExperts,
                comment,
              })
            }
            isReadOnly={hasCommitted}
          />
        </div>

        <div className="border-t border-gray-200 pt-6">
          <h4 className="text-sm font-semibold text-gray-900 mb-2">
            Number of HE Inspectors
          </h4>
          <p className="text-xs text-gray-600 mb-3">
            Nielsen (1994) recommends 3-5 for optimal coverage
          </p>
          <div className="grid grid-cols-3 gap-3 mb-3">
            {["1-2", "3-5", ">5"].map((count) => (
              <button
                key={count}
                type="button"
                onClick={() =>
                  !hasCommitted &&
                  updateField("heInspectors", {
                    ...resources.heInspectors,
                    count: count as "1-2" | "3-5" | ">5",
                  })
                }
                disabled={hasCommitted}
                className={`py-3 rounded-lg border-2 font-medium text-sm transition-all ${
                  resources.heInspectors.count === count
                    ? "border-blue-600 bg-blue-50 text-blue-700"
                    : "border-gray-200 hover:border-gray-300"
                } ${hasCommitted ? "opacity-60 cursor-default" : "cursor-pointer"}`}
              >
                {count}
              </button>
            ))}
          </div>
          <OptionalTextInput
            placeholder="Optional comment..."
            value={resources.heInspectors.comment}
            onChange={(comment) =>
              updateField("heInspectors", {
                ...resources.heInspectors,
                comment,
              })
            }
            isReadOnly={hasCommitted}
          />
        </div>
      </ResourceSection>

      <ResourceSection
        title="Documentary Resources"
        icon={<BookOpen className="w-5 h-5 text-gray-600" />}
      >
        <LevelSelectionCard
          title="Access to Scientific Databases"
          description="ACM, IEEE Xplore, Scopus, Web of Science..."
          selectedLevel={resources.scientificDatabases.level}
          onSelect={(level) =>
            updateField("scientificDatabases", {
              ...resources.scientificDatabases,
              level,
            })
          }
          isReadOnly={hasCommitted}
        />
        <OptionalTextInput
          placeholder="List accessible databases..."
          value={resources.scientificDatabases.comment}
          onChange={(comment) =>
            updateField("scientificDatabases", {
              ...resources.scientificDatabases,
              comment,
            })
          }
          isReadOnly={hasCommitted}
        />

        <div className="border-t border-gray-200 pt-6">
          <LevelSelectionCard
            title="Domain Documentation Level"
            description="Maturity of existing literature on the evaluated domain and its usage context"
            selectedLevel={resources.domainDocumentation.level}
            onSelect={(level) =>
              updateField("domainDocumentation", {
                ...resources.domainDocumentation,
                level,
              })
            }
            isReadOnly={hasCommitted}
          />
          <OptionalTextInput
            placeholder="Specify key references or identified gaps..."
            value={resources.domainDocumentation.comment}
            onChange={(comment) =>
              updateField("domainDocumentation", {
                ...resources.domainDocumentation,
                comment,
              })
            }
            isReadOnly={hasCommitted}
          />
        </div>

        <div className="border-t border-gray-200 pt-6">
          <h4 className="text-sm font-semibold text-gray-900 mb-2">
            Available Project Documentation
          </h4>
          <p className="text-xs text-gray-600 mb-3">
            Link existing documents accessible to the team — requirements,
            analyses, standards, technical specs.
          </p>

          <DocumentLinkField
            value={JSON.stringify(resources.projectDocumentation.documents)}
            onChange={(val) => {
              if (hasCommitted) return;
              try {
                const docs = val ? JSON.parse(val) : [];
                setResources((prev) => {
                  const newData = {
                    ...prev,
                    projectDocumentation: {
                      ...prev.projectDocumentation,
                      documents: docs,
                    },
                  };
                  saveDraft(newData);
                  return newData;
                });
              } catch (e) {
                console.error("Failed to parse documents", e);
              }
            }}
            projectId={projectId || 0}
            placeholder="Select project documentation..."
          />
        </div>
      </ResourceSection>

      <ResourceSection
        title="Material & Financial Resources"
        icon={<DollarSign className="w-5 h-5 text-gray-600" />}
      >
        <LevelSelectionCard
          title="Financial Latitude"
          description="Budget dedicated to the HE project"
          selectedLevel={resources.financialLatitude.level}
          onSelect={(level) =>
            updateField("financialLatitude", {
              ...resources.financialLatitude,
              level,
            })
          }
          isReadOnly={hasCommitted}
        />
        <OptionalTextInput
          placeholder="Specify budget or available resources..."
          value={resources.financialLatitude.comment}
          onChange={(comment) =>
            updateField("financialLatitude", {
              ...resources.financialLatitude,
              comment,
            })
          }
          isReadOnly={hasCommitted}
        />

        <div className="border-t border-gray-200 pt-6">
          <h4 className="text-sm font-semibold text-gray-900 mb-2">
            Available Tools
          </h4>
          <p className="text-xs text-gray-600 mb-3">
            List HE and SoI tools accessible to the team for this project.
          </p>
          <Input
            type="text"
            placeholder="E.g.: GenAI subscriptions, Heurio account..."
            value={resources.availableTools.tools}
            onChange={(e) =>
              updateField("availableTools", {
                ...resources.availableTools,
                tools: e.target.value,
              })
            }
            disabled={hasCommitted}
            className="w-full h-10 text-sm bg-gray-50 border-gray-200 focus:bg-white"
          />
        </div>
      </ResourceSection>

      <ResourceSection
        title="Time Constraints"
        icon={<Clock className="w-5 h-5 text-gray-600" />}
      >
        <LevelSelectionCard
          title="Available Timeline for HE"
          description="Project duration and milestones"
          selectedLevel={resources.timeline.level}
          onSelect={(level) =>
            updateField("timeline", { ...resources.timeline, level })
          }
          isReadOnly={hasCommitted}
        />
        <OptionalTextInput
          placeholder="Specify key milestones and target application date..."
          value={resources.timeline.comment}
          onChange={(comment) =>
            updateField("timeline", { ...resources.timeline, comment })
          }
          isReadOnly={hasCommitted}
        />
      </ResourceSection>

      <div className="flex justify-end pt-4 border-t border-gray-200">
        {hasCommitted ? (
          <Button
            variant="outline"
            onClick={handleUnsubmit}
            className="px-6 py-2 text-sm font-medium"
          >
            Unsubmit
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            className="px-8 py-2 text-sm font-medium bg-gray-900 hover:bg-gray-800 text-white flex items-center gap-2"
          >
            Submit <ArrowRight className="w-4 h-4" />
          </Button>
        )}
      </div>

      <TypingIndicator
        editingUsers={editingUsers}
        fieldName={`${fieldPrefix}-resources`}
      />
    </div>
  );
}

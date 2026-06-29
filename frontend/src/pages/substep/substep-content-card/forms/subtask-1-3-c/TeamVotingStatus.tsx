// frontend/src/pages/substep/substep-content-card/forms/subtask-1-3-c/TeamVotingStatus.tsx

import Avatar from "@/components/Avatar";

interface TeamMember {
  id: number;
  username: string;
  submitted: boolean;
}

interface TeamVotingStatusProps {
  members: TeamMember[];
  teamSize: number;
}

export default function TeamVotingStatus({
  members,
  teamSize,
}: TeamVotingStatusProps) {
  const submittedCount = members.filter((m) => m.submitted).length;
  const waitingCount = teamSize - submittedCount;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Waiting for other participants
        </h3>
        <p className="text-sm text-gray-600">
          You will receive a notification when the synthesis session is ready.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-6">
        {members.map((member) => (
          <div key={member.id} className="flex flex-col items-center gap-2">
            <div
              className={`rounded-full ${
                member.submitted
                  ? "ring-2 ring-emerald-500 ring-offset-2"
                  : "opacity-50 grayscale"
              }`}
            >
              <Avatar username={member.username} size="lg" />
            </div>
            <span
              className={`text-xs font-medium ${
                member.submitted ? "text-emerald-700" : "text-gray-400"
              }`}
            >
              {member.submitted ? "Voted" : "Waiting"}
            </span>
          </div>
        ))}
      </div>

      {waitingCount > 0 && (
        <p className="text-center text-sm text-gray-500">
          {waitingCount} {waitingCount === 1 ? "member" : "members"} yet to vote
        </p>
      )}
    </div>
  );
}

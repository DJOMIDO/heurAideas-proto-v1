// frontend/src/pages/substep/substep-content-card/forms/subtask-1-2-a/DistributionRow.tsx

import Avatar from "@/components/Avatar";

interface User {
  id: number;
  username: string;
}

interface DistributionRowProps {
  label: string;
  color: string;
  count: number;
  total: number;
  users: User[];
}

export default function DistributionRow({
  label,
  color,
  count,
  total,
  users,
}: DistributionRowProps) {
  const percentage = total > 0 ? (count / total) * 100 : 0;

  return (
    <div className="flex items-center gap-4 py-3">
      <div className="w-24 shrink-0">
        <span className="text-sm font-medium" style={{ color }}>
          {label}
        </span>
      </div>

      <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${percentage}%`,
            backgroundColor: color,
          }}
        />
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <div className="flex -space-x-2">
          {users.slice(0, 3).map((user) => (
            <Avatar
              key={user.id}
              username={user.username}
              size="sm"
              className="ring-2 ring-white"
            />
          ))}

          {users.length > 3 && (
            <div className="w-6 h-6 rounded-full bg-gray-200 ring-2 ring-white flex items-center justify-center text-xs font-medium text-gray-600 z-10">
              +{users.length - 3}
            </div>
          )}
        </div>

        <span
          className="text-sm font-semibold ml-2"
          style={{ color: count > 0 ? color : "#9ca3af" }}
        >
          {count}/{total}
        </span>
      </div>
    </div>
  );
}

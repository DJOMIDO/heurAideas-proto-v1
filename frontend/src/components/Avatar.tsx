// frontend/src/components/Avatar.tsx

import {
  Avatar as ShadcnAvatar,
  AvatarFallback,
} from "@/components/ui/avatar";
import { getInitials } from "@/utils/string";
import { cn } from "@/lib/utils";

interface AvatarProps {
  username: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export default function Avatar({
  username,
  size = "md",
  className,
}: AvatarProps) {
  const initials = getInitials(username);

  const sizeClasses = {
    sm: "h-6 w-6 text-xs",
    md: "h-8 w-8 text-sm",
    lg: "h-10 w-10 text-base",
  };

  return (
    <ShadcnAvatar className={cn(sizeClasses[size], className)}>
      <AvatarFallback className="bg-gray-500 text-white font-medium">
        {initials}
      </AvatarFallback>
    </ShadcnAvatar>
  );
}

// frontend/src/hooks/useTypingIndicator.ts
import { useEffect, useRef, useCallback, useState } from "react";
import { useWebSocket } from "./useWebSocket";

interface EditingUser {
  userId: number;
  username: string;
  timestamp: string;
}

interface UseTypingIndicatorOptions {
  projectId: number;
  substepId: string;
  currentUserId: number;
  onEditingUsersChange?: (editingUsers: Record<string, EditingUser>) => void;
}

export function useTypingIndicator({
  projectId,
  substepId,
  currentUserId,
  onEditingUsersChange,
}: UseTypingIndicatorOptions) {
  const typingTimeoutRef = useRef<Map<string, number>>(new Map());
  const [editingUsers, setEditingUsers] = useState<Record<string, EditingUser>>(
    {},
  );

  // 直接复用 useWebSocket 的主连接
  const { send } = useWebSocket({
    projectId,
    enabled: !!projectId && !!substepId,
    onMessage: (message) => {
      if (message.type === "user_typing" && message.substep_id === substepId) {
        if (message.user_id !== currentUserId) {
          setEditingUsers((prev) => {
            const updated = {
              ...prev,
              [message.field]: {
                userId: message.user_id,
                username: message.username,
                timestamp: new Date().toISOString(),
              },
            };
            onEditingUsersChange?.(updated);
            return updated;
          });
        }
      }
    },
  });

  const sendTypingIndicator = useCallback(
    (field: string) => {
      const existingTimeout = typingTimeoutRef.current.get(field);
      if (existingTimeout) {
        window.clearTimeout(existingTimeout);
      }

      const timeoutId = window.setTimeout(() => {
        // 直接使用 send，绝不创建新连接
        if (send) {
          send({
            type: "user_typing",
            substep_id: substepId,
            field,
            user_id: currentUserId,
            username: localStorage.getItem("username") || "Unknown",
          });
        }
      }, 1000);

      typingTimeoutRef.current.set(field, timeoutId);
    },
    [substepId, currentUserId, send],
  );

  // 清理超时编辑状态
  useEffect(() => {
    const cleanup = setInterval(() => {
      const now = Date.now();
      setEditingUsers((prev) => {
        const updated: Record<string, EditingUser> = {};
        Object.entries(prev).forEach(([field, info]) => {
          if (now - new Date(info.timestamp).getTime() < 10000) {
            updated[field] = info;
          }
        });
        if (Object.keys(updated).length !== Object.keys(prev).length) {
          onEditingUsersChange?.(updated);
        }
        return updated;
      });
    }, 1000);
    return () => clearInterval(cleanup);
  }, [onEditingUsersChange]);

  useEffect(() => {
    return () => {
      typingTimeoutRef.current.forEach((id) => window.clearTimeout(id));
    };
  }, []);

  return { sendTypingIndicator, editingUsers };
}

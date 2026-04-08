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

  // 发送编辑状态（1 秒 debounce）
  const sendTypingIndicator = useCallback(
    (field: string) => {
      const token = localStorage.getItem("token");
      if (!token) return;

      // 清除之前的 timeout
      const existingTimeout = typingTimeoutRef.current.get(field);
      if (existingTimeout) {
        window.clearTimeout(existingTimeout);
      }

      // 1 秒 debounce 后发送
      const timeoutId = window.setTimeout(() => {
        const message = {
          type: "user_typing",
          substep_id: substepId,
          field,
          user_id: currentUserId,
          username: localStorage.getItem("username") || "Unknown",
        };

        // 使用独立 WebSocket 连接发送（不存储引用）
        const ws = new WebSocket(
          `ws://localhost:8000/ws/${projectId}?token=${token}`,
        );
        ws.onopen = () => {
          ws.send(JSON.stringify(message));
          ws.close();
        };
      }, 1000);

      typingTimeoutRef.current.set(field, timeoutId);
    },
    [substepId, currentUserId, projectId],
  );

  // 监听 WebSocket 消息（使用 useWebSocket Hook）
  useWebSocket({
    projectId,
    enabled: !!projectId && !!substepId,
    onMessage: (message) => {
      if (message.type === "user_typing" && message.substep_id === substepId) {
        // 更新编辑用户状态（排除自己）
        if (message.user_id !== currentUserId) {
          setEditingUsers((prev) => {
            const updated = {
              ...prev,
              [message.field]: {
                userId: message.user_id,
                username: message.username,
                timestamp: message.timestamp,
              },
            };
            onEditingUsersChange?.(updated);
            return updated;
          });
        }
      }
    },
  });

  // 清理超时编辑状态（5 秒无活动视为停止）
  useEffect(() => {
    const cleanup = setInterval(() => {
      const now = Date.now();
      const timeout = 10000; // 10 秒

      setEditingUsers((prev) => {
        const updated: Record<string, EditingUser> = {};
        Object.entries(prev).forEach(([field, info]) => {
          const timestamp = new Date(info.timestamp).getTime();
          if (now - timestamp < timeout) {
            updated[field] = info;
          }
        });

        // 只在有变化时才调用回调
        if (Object.keys(updated).length !== Object.keys(prev).length) {
          onEditingUsersChange?.(updated);
        }

        return updated;
      });
    }, 1000);

    return () => clearInterval(cleanup);
  }, [onEditingUsersChange]);

  // 组件卸载时清理所有 timeout
  useEffect(() => {
    return () => {
      typingTimeoutRef.current.forEach((timeoutId) => {
        window.clearTimeout(timeoutId);
      });
    };
  }, []);

  return { sendTypingIndicator, editingUsers };
}

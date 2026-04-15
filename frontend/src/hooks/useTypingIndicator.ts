// frontend/src/hooks/useTypingIndicator.ts
import { useEffect, useRef, useCallback } from "react";

interface UseTypingIndicatorProps {
  projectId: number;
  substepId: string;
  currentUserId: number;
  sendWsMessage?: (message: any) => void;
}

export function useTypingIndicator({
  projectId,
  substepId,
  currentUserId,
  sendWsMessage,
}: UseTypingIndicatorProps) {
  const typingTimeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map(),
  );

  const sendTypingIndicator = useCallback(
    (field: string) => {
      if (!sendWsMessage) {
        return;
      }

      const message = {
        type: "user_typing",
        project_id: projectId,
        substep_id: substepId,
        user_id: currentUserId,
        field: field,
        timestamp: new Date().toISOString(),
      };

      try {
        sendWsMessage(message);
      } catch (error) {
        // Silent fail to avoid interrupting user input
      }

      if (typingTimeoutsRef.current.has(field)) {
        clearTimeout(typingTimeoutsRef.current.get(field)!);
      }

      const timeoutId = setTimeout(() => {
        typingTimeoutsRef.current.delete(field);
      }, 3000);

      typingTimeoutsRef.current.set(field, timeoutId);
    },
    [projectId, substepId, currentUserId, sendWsMessage],
  );

  useEffect(() => {
    return () => {
      typingTimeoutsRef.current.forEach((timeoutId) => clearTimeout(timeoutId));
      typingTimeoutsRef.current.clear();
    };
  }, []);

  return {
    sendTypingIndicator,
  };
}

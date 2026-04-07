// frontend/src/hooks/useWebSocket.ts

import { useEffect, useRef, useCallback } from "react";

export interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

export interface UseWebSocketOptions {
  projectId: number;
  onMessage?: (message: WebSocketMessage) => void;
  onError?: (error: Event) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  enabled?: boolean;
}

export function useWebSocket({
  projectId,
  onMessage,
  onError,
  onConnect,
  onDisconnect,
  enabled = true,
}: UseWebSocketOptions) {
  const wsRef = useRef<WebSocket | null>(null);
  // ✅ 修复 1：使用 number 代替 NodeJS.Timeout（浏览器环境）
  // ✅ 修复 2：传入初始值 null
  const reconnectTimeoutRef = useRef<number | null>(null);

  const connect = useCallback(() => {
    if (!enabled) return;

    const token = localStorage.getItem("token");
    if (!token) {
      console.warn("⚠️ No token found, WebSocket auth will fail");
      return;
    }

    const wsUrl = `ws://localhost:8000/ws/${projectId}?token=${token}`;
    console.log(`🔌 Connecting to WebSocket: ${wsUrl}`);

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("✅ WebSocket connected");
      onConnect?.();
    };

    ws.onmessage = (event) => {
      try {
        const data: WebSocketMessage = JSON.parse(event.data);
        console.log("📨 Received:", data);
        onMessage?.(data);
      } catch (error) {
        console.error("⚠️ Failed to parse WebSocket message:", error);
      }
    };

    ws.onclose = () => {
      console.log("❌ WebSocket disconnected");
      onDisconnect?.();

      // 自动重连（5 秒后）
      reconnectTimeoutRef.current = window.setTimeout(() => {
        console.log("🔄 Reconnecting...");
        connect();
      }, 5000);
    };

    ws.onerror = (error) => {
      console.error("⚠️ WebSocket error:", error);
      onError?.(error);
    };
  }, [projectId, onMessage, onError, onConnect, onDisconnect, enabled]);

  const disconnect = useCallback(() => {
    // ✅ 修复 3：检查是否为 null
    if (reconnectTimeoutRef.current !== null) {
      window.clearTimeout(reconnectTimeoutRef.current);
    }
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.close();
    }
    wsRef.current = null;
  }, []);

  const send = useCallback((data: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    } else {
      console.warn("⚠️ WebSocket not connected, message not sent");
    }
  }, []);

  useEffect(() => {
    if (enabled) {
      connect();
    }
    return () => {
      disconnect();
    };
  }, [connect, disconnect, enabled]);

  return {
    send,
    disconnect,
    isConnected: wsRef.current?.readyState === WebSocket.OPEN,
  };
}

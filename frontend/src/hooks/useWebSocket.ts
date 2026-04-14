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
  const reconnectTimeoutRef = useRef<number | null>(null);

  // 重连计数 + 最大尝试次数
  const reconnectCountRef = useRef(0);
  const MAX_RECONNECT = 3; // 最多重连 3 次

  const connect = useCallback(() => {
    if (!enabled) return;

    const token = localStorage.getItem("token");
    if (!token) {
      console.warn("No token found, WebSocket auth will fail");
      return;
    }

    // 动态协议 + 主机（本地/生产自动适配）
    const apiBase = import.meta.env.VITE_API_URL || "http://localhost:8000";
    const host = apiBase.replace(/^https?:\/\//, "");
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${host}/ws/${projectId}?token=${token}`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      // 连接成功，重置重连计数
      reconnectCountRef.current = 0;
      onConnect?.();
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessage?.(data);
      } catch (error) {
        console.error("Failed to parse WebSocket message:", error);
      }
    };

    ws.onclose = (event) => {
      onDisconnect?.();

      // 区分关闭原因，避免无效重连
      if (event.code === 1000) {
        // 正常关闭，不重连
        return;
      }

      if (event.code === 1008) {
        // 认证失败，重连也没用
        console.error("WebSocket auth failed (code 1008)");
        return;
      }

      // 限制重连次数
      if (reconnectCountRef.current >= MAX_RECONNECT) {
        console.warn(`Max reconnection attempts (${MAX_RECONNECT}) reached`);
        return;
      }

      reconnectCountRef.current += 1;
      // 指数退避：1.5s → 2.25s → 3.4s
      const delay = Math.min(
        1000 * Math.pow(1.5, reconnectCountRef.current),
        5000,
      );

      reconnectTimeoutRef.current = window.setTimeout(() => {
        connect();
      }, delay);
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      onError?.(error);
    };
  }, [projectId, onMessage, onError, onConnect, onDisconnect, enabled]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current !== null) {
      window.clearTimeout(reconnectTimeoutRef.current);
    }
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.close();
    }
    wsRef.current = null;
    reconnectCountRef.current = 0;
  }, []);

  const send = useCallback((data: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
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

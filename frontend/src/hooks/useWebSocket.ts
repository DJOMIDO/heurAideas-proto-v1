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
  onConnect,
  onDisconnect,
  enabled = true,
}: UseWebSocketOptions) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);

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
      onConnect?.();
    };

    ws.onmessage = (event) => {
      try {
        const data: WebSocketMessage = JSON.parse(event.data);
        onMessage?.(data);
      } catch {
        // 解析失败静默处理
      }
    };

    ws.onclose = () => {
      // 不重连！让业务逻辑决定是否需要重连
      onDisconnect?.();
    };

    // 静默处理错误，不打印到控制台，也不调用 onError
    // 避免 "WebSocket is closed before..." 和 "The network connection was lost" 刷屏
    ws.onerror = () => {
      // 本地/生产环境的网络波动是正常现象，静默处理
      // 功能正常即可，避免控制台刷屏干扰调试
      // onError?.(error);  ← 故意不调用，避免外部回调也打印错误
    };
  }, [projectId, onMessage, onConnect, onDisconnect, enabled]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current !== null) {
      window.clearTimeout(reconnectTimeoutRef.current);
    }
    // 只在连接已建立时才关闭，避免 "closed before established"
    if (
      wsRef.current &&
      wsRef.current.readyState !== WebSocket.CONNECTING &&
      wsRef.current.readyState !== WebSocket.CLOSED
    ) {
      wsRef.current.close();
    }
    wsRef.current = null;
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

import { useEffect, useRef, useCallback, useState } from "react";

export interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

export interface UseWebSocketOptions {
  projectId?: number;
  userId?: number; // 用于用户级全局连接（如 Menu 页面）
  onMessage?: (message: WebSocketMessage) => void;
  onError?: (error: Event) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  enabled?: boolean;
}

export function useWebSocket({
  projectId,
  userId,
  onMessage,
  onError,
  onConnect,
  onDisconnect,
  enabled = true,
}: UseWebSocketOptions) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const reconnectAttemptsRef = useRef<number>(0);
  const maxReconnectAttempts = 5;
  const [isConnected, setIsConnected] = useState(false);

  // 使用 ref 存储回调，避免回调变化触发 connect 重跑
  const onMessageRef = useRef(onMessage);
  const onErrorRef = useRef(onError);
  const onConnectRef = useRef(onConnect);
  const onDisconnectRef = useRef(onDisconnect);

  // 同步最新的回调到 ref
  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);
  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);
  useEffect(() => {
    onConnectRef.current = onConnect;
  }, [onConnect]);
  useEffect(() => {
    onDisconnectRef.current = onDisconnect;
  }, [onDisconnect]);

  // 断开连接辅助函数
  const cleanup = useCallback(() => {
    if (reconnectTimeoutRef.current !== null) {
      window.clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.onopen = null;
      wsRef.current.onmessage = null;
      wsRef.current.onclose = null;
      wsRef.current.onerror = null;

      if (wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close();
      }
      wsRef.current = null;
    }
    setIsConnected(false);
  }, []);

  const connect = useCallback(() => {
    if (!enabled) return;

    // 既没有 userId 也没有 projectId，则不建立连接
    if (!userId && !projectId) return;

    // 如果已有连接且处于开放状态，直接返回，绝不重复创建
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      return;
    }

    // 清理旧连接残留
    cleanup();

    // 智能构建 WebSocket URL (支持项目级和用户级)
    let wsUrl: string;
    const explicitWsUrl = import.meta.env.VITE_WS_URL;

    // 1. 确定连接路径
    let wsPath = "";
    if (userId) {
      wsPath = "/ws/user"; // 用户级全局频道
    } else if (projectId) {
      wsPath = `/ws/${projectId}`; // 项目级频道
    }

    // 2. 拼接完整 URL
    if (explicitWsUrl) {
      wsUrl = `${explicitWsUrl}${wsPath}?token=${token}`;
    } else {
      const apiBaseUrl =
        import.meta.env.VITE_API_URL || "http://localhost:8000";
      try {
        const urlObj = new URL(apiBaseUrl);
        const protocol = urlObj.protocol === "https:" ? "wss:" : "ws:";
        const host = urlObj.host;
        wsUrl = `${protocol}//${host}${wsPath}?token=${token}`;
      } catch (e) {
        wsUrl = `ws://localhost:8000${wsPath}?token=${token}`;
      }
    }

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      reconnectAttemptsRef.current = 0;
      setIsConnected(true);
      onConnectRef.current?.();
    };

    ws.onmessage = (event) => {
      try {
        const data: WebSocketMessage = JSON.parse(event.data);
        onMessageRef.current?.(data);
      } catch (error) {
        // 静默失败
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      onDisconnectRef.current?.();

      // 智能重连机制
      if (enabled && reconnectAttemptsRef.current < maxReconnectAttempts) {
        reconnectAttemptsRef.current += 1;
        const delay = Math.min(
          1000 * Math.pow(2, reconnectAttemptsRef.current),
          30000,
        );

        reconnectTimeoutRef.current = window.setTimeout(() => {
          connect();
        }, delay);
      }
    };

    ws.onerror = (error) => {
      onErrorRef.current?.(error);
    };
  }, [projectId, userId, enabled, cleanup]); // 依赖项加入 userId

  const disconnect = useCallback(() => {
    reconnectAttemptsRef.current = maxReconnectAttempts + 1;
    cleanup();
  }, [cleanup]);

  const send = useCallback((data: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      try {
        wsRef.current.send(JSON.stringify(data));
        return true;
      } catch (error) {
        return false;
      }
    }
    return false;
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
    isConnected,
  };
}

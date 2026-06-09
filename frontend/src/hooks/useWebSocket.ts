import { useEffect, useRef, useCallback, useState } from "react";

export interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

export interface UseWebSocketOptions {
  projectId?: number;
  userId?: number;
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

  const onMessageRef = useRef(onMessage);
  const onErrorRef = useRef(onError);
  const onConnectRef = useRef(onConnect);
  const onDisconnectRef = useRef(onDisconnect);

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
    if (!userId && !projectId) return;
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) return;

    const token = localStorage.getItem("token");
    if (!token) return;

    cleanup();

    let wsUrl: string;
    const explicitWsUrl = import.meta.env.VITE_WS_URL;
    let wsPath = "";
    if (userId) wsPath = "/ws/user";
    else if (projectId) wsPath = `/ws/${projectId}`;

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
  }, [projectId, userId, enabled, cleanup]);

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

  // 监听页面可见性变化，解决浏览器后台标签页休眠导致 WebSocket 断开的问题
  useEffect(() => {
    if (!enabled) return;

    connect();

    const handleVisibilityChange = () => {
      // 当用户从后台切回当前标签页时
      if (document.visibilityState === "visible") {
        // 检查连接是否已断开
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
          console.log("[WebSocket] Page became visible. Reconnecting...");
          // 重置重连次数，立即尝试重连
          reconnectAttemptsRef.current = 0;
          connect();
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      disconnect();
    };
  }, [connect, disconnect, enabled]);

  return {
    send,
    disconnect,
    isConnected,
  };
}

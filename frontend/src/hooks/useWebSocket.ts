// src/hooks/useWebSocket.ts

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
  const isUnmountingRef = useRef(false);

  // 使用 Ref 存储动态参数，避免 useCallback 依赖项变化导致 useEffect 频繁重新执行
  const paramsRef = useRef({ projectId, userId, enabled });
  useEffect(() => {
    paramsRef.current = { projectId, userId, enabled };
  }, [projectId, userId, enabled]);

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
      // 先置空事件处理器，防止 close 过程中触发回调
      wsRef.current.onopen = null;
      wsRef.current.onmessage = null;
      wsRef.current.onclose = null;
      wsRef.current.onerror = null;

      // 只在 OPEN 状态下主动 close，避免 "closed before connection is established" 警告
      // 如果还在 CONNECTING，直接丢弃引用，让浏览器自己处理超时，彻底消除控制台警告
      if (wsRef.current.readyState === WebSocket.OPEN) {
        try {
          wsRef.current.close(1000, "Component unmounting");
        } catch (e) {
          // 忽略
        }
      }
      wsRef.current = null;
    }
    setIsConnected(false);
  }, []);

  const connect = useCallback(() => {
    const { projectId: pId, userId: uId, enabled: en } = paramsRef.current;
    if (!en) return;
    if (!uId && !pId) return;
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) return;

    const token = localStorage.getItem("token");
    if (!token) return;

    cleanup();

    let wsUrl: string;
    const explicitWsUrl = import.meta.env.VITE_WS_URL;
    let wsPath = "";
    if (uId) wsPath = "/ws/user";
    else if (pId) wsPath = `/ws/${pId}`;

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
      if (isUnmountingRef.current) return;
      reconnectAttemptsRef.current = 0;
      setIsConnected(true);
      onConnectRef.current?.();
    };

    ws.onmessage = (event) => {
      if (isUnmountingRef.current) return;
      try {
        const data: WebSocketMessage = JSON.parse(event.data);
        onMessageRef.current?.(data);
      } catch (error) {
        // 静默失败
      }
    };

    ws.onclose = () => {
      if (isUnmountingRef.current) return;
      setIsConnected(false);
      onDisconnectRef.current?.();

      const { enabled: en } = paramsRef.current;
      if (en && reconnectAttemptsRef.current < maxReconnectAttempts) {
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
      if (isUnmountingRef.current) return;
      onErrorRef.current?.(error);
    };
  }, [cleanup]);

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
    const { enabled: en } = paramsRef.current;
    if (!en) return;

    isUnmountingRef.current = false;
    connect();

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
          if (!isUnmountingRef.current) {
            reconnectAttemptsRef.current = 0;
            connect();
          }
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      isUnmountingRef.current = true;
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    send,
    disconnect,
    isConnected,
  };
}

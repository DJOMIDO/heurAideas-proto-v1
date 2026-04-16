import { useEffect, useRef, useCallback, useState } from "react";

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

    // 智能构建 WebSocket URL
    // 1. 优先使用显式定义的 VITE_WS_URL (如果在 Netlify 环境变量中设置了)
    // 2. 否则，基于 VITE_API_URL 自动推导 (https -> wss, http -> ws)
    // 3. 最后回退到 localhost (本地开发)
    let wsUrl: string;
    const explicitWsUrl = import.meta.env.VITE_WS_URL;

    if (explicitWsUrl) {
      wsUrl = `${explicitWsUrl}/ws/${projectId}?token=${token}`;
    } else {
      const apiBaseUrl =
        import.meta.env.VITE_API_URL || "http://localhost:8000";
      try {
        const urlObj = new URL(apiBaseUrl);
        const protocol = urlObj.protocol === "https:" ? "wss:" : "ws:";
        // 去掉末尾的斜杠，防止拼接错误
        const host = urlObj.host;
        wsUrl = `${protocol}//${host}/ws/${projectId}?token=${token}`;
      } catch (e) {
        // 如果解析失败，回退到 localhost
        wsUrl = `ws://localhost:8000/ws/${projectId}?token=${token}`;
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
  }, [projectId, enabled, cleanup]);

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

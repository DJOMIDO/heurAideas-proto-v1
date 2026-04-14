// frontend/src/lib/websocketManager.ts
export interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

type MessageHandler = (message: WebSocketMessage) => void;
type DisconnectHandler = () => void;

interface WSConnection {
  ws: WebSocket;
  handlers: Map<string, MessageHandler>;
  disconnectHandlers: Set<DisconnectHandler>;
  isConnected: boolean;
}

class WebSocketManager {
  private static instance: WebSocketManager;
  private connections = new Map<number, WSConnection>();
  private handlerIdCounter = 0;

  private constructor() {}

  static getInstance(): WebSocketManager {
    if (!WebSocketManager.instance) {
      WebSocketManager.instance = new WebSocketManager();
    }
    return WebSocketManager.instance;
  }

  subscribe(
    projectId: number,
    token: string,
    onMessage: MessageHandler,
    onDisconnect?: DisconnectHandler,
  ): () => void {
    const handlerId = `handler-${++this.handlerIdCounter}`;

    // 如果已有连接，直接添加 handler
    const existing = this.connections.get(projectId);
    if (existing) {
      existing.handlers.set(handlerId, onMessage);
      if (onDisconnect) existing.disconnectHandlers.add(onDisconnect);

      return () => {
        existing.handlers.delete(handlerId);
        if (onDisconnect) existing.disconnectHandlers.delete(onDisconnect);
        // 只有最后一个 handler 移除时才关闭连接
        if (existing.handlers.size === 0) {
          // 只在连接已建立时才关闭
          if (
            existing.isConnected &&
            existing.ws.readyState !== WebSocket.CLOSED
          ) {
            existing.ws.close();
          }
          this.connections.delete(projectId);
        }
      };
    }

    // 创建新连接（动态 URL）
    const apiBase = import.meta.env.VITE_API_URL || "http://localhost:8000";
    const host = apiBase.replace(/^https?:\/\//, "");
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${host}/ws/${projectId}?token=${token}`;

    const ws = new WebSocket(wsUrl);
    const handlers = new Map<string, MessageHandler>([[handlerId, onMessage]]);
    const disconnectHandlers = onDisconnect
      ? new Set([onDisconnect])
      : new Set<DisconnectHandler>();

    // 标记连接状态
    let isConnected = false;

    ws.onopen = () => {
      isConnected = true;
      console.log(`WebSocket connected to project ${projectId}`);
    };

    ws.onmessage = (event) => {
      try {
        const data: WebSocketMessage = JSON.parse(event.data);
        handlers.forEach((h) => h(data));
      } catch (error) {
        console.error("Failed to parse WebSocket message:", error);
      }
    };

    ws.onclose = () => {
      console.log(`ℹWebSocket closed for project ${projectId}`);
      disconnectHandlers.forEach((h) => h());
      this.connections.delete(projectId);
    };

    ws.onerror = (error) => {
      console.error(`WebSocket error for project ${projectId}:`, error);
    };

    this.connections.set(projectId, {
      ws,
      handlers,
      disconnectHandlers,
      isConnected,
    });

    return () => {
      // 只在连接已建立时才关闭
      if (
        isConnected &&
        ws.readyState !== WebSocket.CLOSED &&
        ws.readyState !== WebSocket.CLOSING
      ) {
        ws.close();
      }
      // 如果还在 CONNECTING 状态，直接删除，不关闭
      this.connections.delete(projectId);
    };
  }

  send(projectId: number, data: any): boolean {
    const conn = this.connections.get(projectId);
    if (conn?.ws.readyState === WebSocket.OPEN) {
      conn.ws.send(JSON.stringify(data));
      return true;
    }
    return false;
  }

  isConnected(projectId: number): boolean {
    return this.connections.get(projectId)?.ws.readyState === WebSocket.OPEN;
  }
}

export const wsManager = WebSocketManager.getInstance();

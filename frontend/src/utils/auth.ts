// frontend/src/utils/auth.ts

export interface UserInfo {
  name: string;
  email: string;
  id?: number;
}

const AUTH_MODE = import.meta.env.VITE_AUTH_MODE || "mock";
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

function createMockToken(username: string): string {
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = btoa(JSON.stringify({ sub: username, user_id: 1 }));
  const signature = "mock-signature";
  return `${header}.${payload}.${signature}`;
}

function decodeToken(token: string): any {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return null;
  }
}

// 获取用户 ID
export function getUserId(): number | null {
  const token = localStorage.getItem("token");
  if (!token) return null;

  const payload = decodeToken(token);
  return payload?.user_id || null;
}

export function getUserInfo(): UserInfo | null {
  const token = localStorage.getItem("token");
  const username = localStorage.getItem("username");

  if (!token || !username) return null;

  if (AUTH_MODE === "mock") {
    return {
      name: username,
      email: localStorage.getItem("email") || "",
      id: 1, // Mock 模式固定 ID
    };
  }

  try {
    const payload = decodeToken(token);
    return {
      name: username,
      email: payload?.email || payload?.sub || "",
      id: payload?.user_id || null, // 用户 ID
    };
  } catch {
    return { name: username, email: "" };
  }
}

// signOut 清除所有用户相关的 localStorage key
export function signOut(): void {
  const userId = getUserId();

  localStorage.removeItem("token");
  localStorage.removeItem("username");
  localStorage.removeItem("email");

  // 清除当前用户的项目相关 key
  if (userId) {
    localStorage.removeItem(`currentProjectId-${userId}`);
    localStorage.removeItem(`overview-active-step-${userId}`);

    // 清除该用户的所有 last-edited 记录
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (
        key &&
        (key.startsWith(`substep-state-${userId}-`) ||
          key.startsWith(`last-edited-${userId}-`))
      ) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key));
  }
  localStorage.removeItem("overview-active-step");
}

export function isAuthenticated(): boolean {
  return !!localStorage.getItem("token");
}

export function getToken(): string | null {
  return localStorage.getItem("token");
}

export async function handleAuth(
  email: string,
  password: string,
  username?: string,
  mode: "login" | "register" = "login",
): Promise<{ success: boolean; error?: string }> {
  if (AUTH_MODE === "mock") {
    await new Promise((resolve) => setTimeout(resolve, 400));

    if (password.length < 6) {
      return {
        success: false,
        error: "Password must be at least 6 characters",
      };
    }

    let authUsername: string;
    if (mode === "register" && username) {
      authUsername = username;
    } else {
      authUsername =
        username ||
        localStorage.getItem("username") ||
        email.split("@")[0] ||
        "devuser";
    }

    const mockToken = createMockToken(authUsername);

    localStorage.setItem("token", mockToken);
    localStorage.setItem("username", authUsername);
    localStorage.setItem("email", email);

    return { success: true };
  }

  try {
    const endpoint = mode === "login" ? "/auth/login" : "/auth/register";
    const body =
      mode === "login"
        ? { email, password }
        : { email, username: username || email.split("@")[0], password };

    const response = await fetch(`${API_URL}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.detail || "Request failed" };
    }

    if (mode === "login") {
      localStorage.setItem("token", data.access_token);
      const payload = decodeToken(data.access_token);
      localStorage.setItem(
        "username",
        payload?.sub || username || email.split("@")[0],
      );
      localStorage.setItem("email", payload?.email || email);
    }

    return { success: true };
  } catch (error) {
    console.error("Auth error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Network error",
    };
  }
}

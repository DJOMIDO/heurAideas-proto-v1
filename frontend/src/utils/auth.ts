// frontend/src/utils/auth.ts

export interface UserInfo {
  name: string;
  email: string;
  id?: number;
}

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

function decodeToken(token: string): any {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return null;
  }
}

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

export function signOut(): void {
  const userId = getUserId();

  localStorage.removeItem("token");
  localStorage.removeItem("username");
  localStorage.removeItem("email");

  if (userId) {
    localStorage.removeItem(`currentProjectId-${userId}`);
    localStorage.removeItem(`overview-active-step-${userId}`);

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

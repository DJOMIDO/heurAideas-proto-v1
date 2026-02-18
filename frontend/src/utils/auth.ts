// src/utils/auth.ts

export interface UserInfo {
  name: string;
  email: string;
}

// 🔧 配置：从环境变量读取认证模式
const AUTH_MODE = import.meta.env.VITE_AUTH_MODE || "real";
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

// 生成 Mock JWT（仅开发用，无实际加密）
function createMockToken(username: string): string {
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = btoa(JSON.stringify({ sub: username }));
  const signature = "mock-signature";
  return `${header}.${payload}.${signature}`;
}

// 解码 JWT payload（通用工具）
function decodeToken(token: string): any {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return null;
  }
}

// 获取当前用户信息（Mock/Real 自动切换）
export function getUserInfo(): UserInfo | null {
  const token = localStorage.getItem("token");
  const username = localStorage.getItem("username");

  if (!token || !username) return null;

  // Mock 模式：使用 localStorage 中的 username 和 email
  if (AUTH_MODE === "mock") {
    return {
      name: username,
      email: localStorage.getItem("email") || "", // 读取用户输入的邮箱
    };
  }

  // Real 模式：解码真实 JWT
  try {
    const payload = decodeToken(token);
    return {
      name: username,
      email: payload?.email || payload?.sub || "",
    };
  } catch {
    return { name: username, email: "" };
  }
}

// 登出：清除本地存储
export function signOut(): void {
  localStorage.removeItem("token");
  localStorage.removeItem("username");
  localStorage.removeItem("email"); // 新增：清除 email
}

// 检查是否已认证
export function isAuthenticated(): boolean {
  return !!localStorage.getItem("token");
}

// 统一登录/注册处理函数（Mock/Real 自动切换）
export async function handleAuth(
  email: string,
  password: string,
  username?: string,
  mode: "login" | "register" = "login",
): Promise<{ success: boolean; error?: string }> {
  // Mock 模式：模拟 API 响应
  if (AUTH_MODE === "mock") {
    await new Promise((resolve) => setTimeout(resolve, 400)); // 模拟网络延迟

    // 简单验证（仅用于开发测试）
    if (password.length < 6) {
      return {
        success: false,
        error: "Password must be at least 6 characters",
      };
    }

    // 确定 username 的优先级逻辑
    let authUsername: string;
    if (mode === "register" && username) {
      // 注册：使用用户输入的用户名
      authUsername = username;
    } else {
      // 登录：已保存的 username > 传入的 username > 邮箱前缀 > 默认值
      authUsername =
        username ||
        localStorage.getItem("username") ||
        email.split("@")[0] ||
        "devuser";
    }

    const mockToken = createMockToken(authUsername);

    // 保存 token、username 和 email 到 localStorage
    localStorage.setItem("token", mockToken);
    localStorage.setItem("username", authUsername);
    localStorage.setItem("email", email); // ← 新增：保存用户输入的邮箱

    return { success: true };
  }

  // Real 模式：调用真实后端 API
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

    // 登录成功：保存 token 和 username
    if (mode === "login") {
      localStorage.setItem("token", data.access_token);
      const payload = decodeToken(data.access_token);
      localStorage.setItem(
        "username",
        payload?.sub || username || email.split("@")[0],
      );
      // Real 模式下邮箱从 JWT payload 获取，不需要额外保存
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

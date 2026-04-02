// frontend/src/api/users.ts
import { getToken } from "@/utils/auth";

export interface User {
  id: number;
  email: string;
  username: string;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export async function getUserList(): Promise<User[]> {
  const token = getToken();

  const response = await fetch(`${API_BASE_URL}/users`, {
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ detail: "Failed to fetch users" }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }

  return response.json();
}

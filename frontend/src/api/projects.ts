// src/api/projects.ts

import { API_BASE_URL, API_ENDPOINTS } from "./config";
import type {
  Project,
  ProjectList,
  ProjectDetail,
  SubstepContent,
  SubstepContentCreate,
  CreateProjectInput,
} from "@/types/project";
import { getToken } from "@/utils/auth";

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const token = getToken();

  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }

  return response.json();
}

export async function getProjects(): Promise<ProjectList[]> {
  return request<ProjectList[]>(API_ENDPOINTS.PROJECTS);
}

export async function createProject(
  input: CreateProjectInput,
): Promise<Project> {
  return request<Project>(API_ENDPOINTS.PROJECTS, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function getProjectDetail(id: number): Promise<ProjectDetail> {
  return request<ProjectDetail>(API_ENDPOINTS.PROJECT_DETAIL(id));
}

export async function getSubstepContent(
  projectId: number,
  substepId: string,
): Promise<SubstepContent | null> {
  try {
    return await request<SubstepContent>(
      API_ENDPOINTS.SUBSTEP_CONTENT(projectId, substepId),
    );
  } catch (error) {
    return null;
  }
}

export async function saveSubstepContent(
  projectId: number,
  substepId: string,
  content: SubstepContentCreate,
): Promise<SubstepContent> {
  return request<SubstepContent>(
    API_ENDPOINTS.SUBSTEP_CONTENT(projectId, substepId),
    {
      method: "POST",
      body: JSON.stringify(content),
    },
  );
}

// src/utils/substepState.ts

export interface SubstepState {
  activeTab: string;
  formData: Record<string, any>;
  lastSaved?: string;
}

const STORAGE_PREFIX = "substep-state-";

export function getSubstepState(substepId: string): SubstepState | null {
  const data = localStorage.getItem(`${STORAGE_PREFIX}${substepId}`);
  if (!data) return null;
  return JSON.parse(data);
}

export function saveSubstepState(substepId: string, state: Partial<SubstepState>): void {
  const existing = getSubstepState(substepId) || {
    activeTab: "description",
    formData: {},
  };
  
  const merged = {
    ...existing,
    ...state,
    lastSaved: new Date().toISOString(),
  };
  
  localStorage.setItem(`${STORAGE_PREFIX}${substepId}`, JSON.stringify(merged));
}
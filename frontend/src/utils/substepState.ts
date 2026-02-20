// src/utils/substepState.ts

export interface SubstepState {
  activeTab: string;
  formData: Record<string, any>;
  lastSaved?: string;

  // ─────────────────────────────────────────
  // 🔹 分屏视图相关字段（可选，向后兼容）
  // ─────────────────────────────────────────
  viewMode?: "single" | "split";
  splitView?: {
    leftTab: string; // 左侧显示的 tab id
    rightTab: string; // 右侧显示的 tab id
  };
}

const STORAGE_PREFIX = "substep-state-";

export function getSubstepState(substepId: string): SubstepState | null {
  const data = localStorage.getItem(`${STORAGE_PREFIX}${substepId}`);
  if (!data) return null;

  try {
    const parsed = JSON.parse(data);
    return {
      activeTab: parsed.activeTab ?? "description",
      formData: parsed.formData ?? {},
      lastSaved: parsed.lastSaved,
      viewMode: parsed.viewMode,
      splitView: parsed.splitView,
    };
  } catch (error) {
    console.warn(`Failed to parse substep state for ${substepId}:`, error);
    return null;
  }
}

export function saveSubstepState(
  substepId: string,
  state: Partial<SubstepState>,
): void {
  const existing = getSubstepState(substepId) || {
    activeTab: "description",
    formData: {},
  };

  const merged = {
    ...existing,
    ...state,
    lastSaved: new Date().toISOString(),
  };

  try {
    localStorage.setItem(
      `${STORAGE_PREFIX}${substepId}`,
      JSON.stringify(merged),
    );
  } catch (error) {
    console.warn(`Failed to save substep state for ${substepId}:`, error);
  }
}

// 🔹 辅助函数：清除某个 substep 的本地状态（调试用）
export function clearSubstepState(substepId: string): void {
  localStorage.removeItem(`${STORAGE_PREFIX}${substepId}`);
}

// frontend/src/pages/substep/substep-content-card/forms/subtask-2-1-a/types.ts

export interface QualityCriteria {
  id: string;
  value: string;
}

export interface ObservableElement {
  id: string;
  value: string;
}

export interface Constraint {
  id: string;
  type: string;
  value: string;
  observables: ObservableElement[];
}

export interface Stakeholder {
  id: string;
  name: string;
  role: string;
  color: string;
}

export interface SubtaskData {
  id: string;
  name: string;
  state: string;
  isExpanded: boolean;
  selectedCriteria: string[];
  selectedStakeholders: string[];
  selectedConstraints: string[];
}

export interface TaskData {
  id: string;
  name: string;
  state: string;
  objective: string;
  qualityCriteria: QualityCriteria[];
  constraints: Constraint[];
  subtasks: SubtaskData[];
  isExpanded: boolean;
}


/**
 * 2.1.A 面板的完整内容结构
 * 将直接序列化为 JSON 存入 substep_contents.content_data 字段
 */
export interface Subtask2_1AContent {
  /** 乐观锁版本号，用于冲突检测 */
  version: number;

  /** 任务列表（支持无限嵌套） */
  tasks: TaskData[];

  /** 元数据（可选） */
  metadata?: {
    /** 最后保存的用户 ID */
    lastSavedBy?: number;
    /** 最后保存的时间戳 */
    lastSavedAt?: string;
  };
}

/**
 * API 请求/响应的包装类型
 * 与后端 SubstepContentCreate / SubstepContentResponse 对齐
 */
export interface Subtask2_1AApiPayload {
  content_data: Subtask2_1AContent;
  ui_state?: Record<string, any>;
}

// frontend/src/utils/formDataUtils.ts

/**
 * 清理 formData 中的空字段
 *
 * 规则：
 * - 空字符串 '' → 删除
 * - null → 删除
 * - undefined → 删除
 * - "0" → 保留（可能是有效值）
 * - element-row-count 为 0 或 "0" → 删除
 */
export function cleanupEmptyFormDataFields(
  formData: Record<string, any>,
): Record<string, any> {
  const cleaned: Record<string, any> = {};

  Object.entries(formData).forEach(([key, value]) => {
    // 白名单 1：团队提交数据永远保留
    if (key.includes("knowledge_submissions")) {
      cleaned[key] = value;
      return;
    }

    // 白名单 2：Primary Elements 的行数计数永远保留（即使为 0）
    if (key.includes("element-row-count")) {
      cleaned[key] = value;
      return;
    }

    // 保留非空值
    if (value !== null && value !== undefined && value !== "") {
      cleaned[key] = value;
    }
    // 其他空值不添加
  });

  return cleaned;
}

// frontend/src/utils/formDataUtils.ts

export function cleanupEmptyFormDataFields(
  formData: Record<string, any>,
): Record<string, any> {
  const cleaned: Record<string, any> = {};

  Object.entries(formData).forEach(([key, value]) => {
    if (key.includes("knowledge_submissions")) {
      cleaned[key] = value;
      return;
    }

    if (key.includes("element-row-count")) {
      cleaned[key] = value;
      return;
    }

    if (value !== null && value !== undefined && value !== "") {
      cleaned[key] = value;
    }
  });

  return cleaned;
}

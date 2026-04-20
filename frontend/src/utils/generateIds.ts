// frontend/src/utils/generateIds.ts

/**
 * Generate a sequence of formatted IDs with a given prefix.
 * @param prefix ID prefix (e.g., "N" for needs, "E" for effects)
 * @param count Number of IDs to generate
 * @param startFrom Starting number for the sequence (default is 1)
 * @returns Array of formatted IDs (e.g., ["N001", "N002", ...])
 */
export function generateIdSequence(
  prefix: string,
  count: number,
  startFrom: number = 1,
): string[] {
  return Array.from({ length: count }, (_, idx) => {
    const num = startFrom + idx;
    return `${prefix}${String(num).padStart(3, "0")}`;
  });
}

/**
 * Format a single ID with a given prefix and index.
 */
export function formatId(prefix: string, index: number): string {
  return `${prefix}${String(index + 1).padStart(3, "0")}`;
}

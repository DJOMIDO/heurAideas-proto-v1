// frontend/src/utils/string.ts

/**
 * 从姓名生成首字母缩写
 * 兼容空值和 "Unknown"
 */
export function getInitials(name: string): string {
  if (!name || name === "Unknown") return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

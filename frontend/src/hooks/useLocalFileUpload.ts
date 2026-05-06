// src/hooks/useLocalFileUpload.ts

import { useState, useCallback } from "react";
import type { DocumentNode } from "@/pages/documents/types";

export function useLocalFileUpload() {
  const [isProcessing, setIsProcessing] = useState(false);

  const processFiles = useCallback(
    (fileList: FileList | null): DocumentNode[] => {
      if (!fileList || fileList.length === 0) return [];

      setIsProcessing(true);

      // 将浏览器 File 对象转换为我们的 DocumentNode 结构
      const localFiles: DocumentNode[] = Array.from(fileList).map((file) => ({
        id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        name: file.name,
        type: "file",
        extension: file.name.split(".").pop()?.toLowerCase() || "unknown",
        size: file.size,
        updatedAt: new Date(file.lastModified).toISOString(),
        // 本地模式不生成 URL，后续接存储时再替换
        url: undefined,
      }));

      setIsProcessing(false);
      return localFiles;
    },
    [],
  );

  return { isProcessing, processFiles };
}

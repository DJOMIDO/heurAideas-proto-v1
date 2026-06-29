// frontend/src/hooks/useLocalFileUpload.ts

import { useState, useCallback } from "react";
import type { DocumentNode } from "@/pages/documents/types";

export function useLocalFileUpload() {
  const [isProcessing, setIsProcessing] = useState(false);

  const processFiles = useCallback(
    (fileList: FileList | null): Omit<DocumentNode, "projectId">[] => {
      if (!fileList || fileList.length === 0) return [];

      setIsProcessing(true);

      const localFiles: Omit<DocumentNode, "projectId">[] = Array.from(
        fileList,
      ).map((file) => ({
        id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        name: file.name,
        type: "file",
        extension: file.name.split(".").pop()?.toLowerCase() || "unknown",
        size: file.size,
        updatedAt: new Date(file.lastModified).toISOString(),
        file: file,
        url: undefined,
      }));

      setIsProcessing(false);
      return localFiles;
    },
    [],
  );

  return { isProcessing, processFiles };
}

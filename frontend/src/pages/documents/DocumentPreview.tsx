// src/pages/documents/DocumentPreview.tsx

import { FileText } from "lucide-react";
import type { DocumentPreviewProps } from "./types";

export default function DocumentPreview({ document }: DocumentPreviewProps) {
  if (!document) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-gray-50">
        <div className="text-center text-gray-400">
          <FileText className="w-16 h-16 mx-auto mb-4" />
          <p className="text-sm">Select a document to visualize it</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
        <p className="text-gray-600 font-medium text-lg">{document.name}</p>
        <p className="text-sm text-gray-400 mt-2">
          {document.extension?.toUpperCase() || "FILE"} •{" "}
          {formatSize(document.size || 0)}
          {document.updatedAt &&
            ` • ${new Date(document.updatedAt).toLocaleDateString()}`}
        </p>
      </div>
    </div>
  );
}

function formatSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}

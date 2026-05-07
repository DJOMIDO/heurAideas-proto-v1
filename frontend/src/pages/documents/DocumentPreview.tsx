// frontend/src/pages/documents/DocumentPreview.tsx

import { useState, useEffect } from "react";
import { FileText, Download } from "lucide-react";
import ImageZoom from "react-medium-image-zoom";
import "react-medium-image-zoom/dist/styles.css";
import type { DocumentPreviewProps } from "./types";

export default function DocumentPreview({ document }: DocumentPreviewProps) {
  const [textContent, setTextContent] = useState<string>("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // 清理 URL 对象
  useEffect(() => {
    return () => {
      if (previewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // 创建预览 URL
  useEffect(() => {
    if (!document) {
      setPreviewUrl(null);
      setTextContent("");
      return;
    }

    if (document.url) {
      setPreviewUrl(document.url);
      return;
    }

    if (document.file) {
      const blobUrl = URL.createObjectURL(document.file);
      setPreviewUrl(blobUrl);

      const extension = document.extension?.toLowerCase();
      const isText = [
        "txt",
        "md",
        "csv",
        "json",
        "xml",
        "html",
        "css",
      ].includes(extension || "");
      if (isText) {
        document.file
          .text()
          .then(setTextContent)
          .catch(() => setTextContent(""));
      }
    } else {
      setPreviewUrl(null);
      setTextContent("");
    }
  }, [document]);

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

  const extension = document.extension?.toLowerCase();
  const isImage = ["png", "jpg", "jpeg", "gif", "svg", "webp"].includes(
    extension || "",
  );
  const isText = ["txt", "md", "csv", "json", "xml", "html", "css"].includes(
    extension || "",
  );
  const isPDF = extension === "pdf";

  // 直接条件渲染，不使用 render 函数
  if (isImage) {
    if (!previewUrl) {
      return (
        <div className="h-full w-full flex items-center justify-center bg-gray-50">
          <p className="text-gray-500 text-sm">Unable to load image</p>
        </div>
      );
    }

    return (
      <div className="h-full w-full flex items-center justify-center p-8 bg-gray-100">
        <ImageZoom>
          <img
            src={previewUrl}
            alt={document.name}
            className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
          />
        </ImageZoom>
      </div>
    );
  }

  if (isText) {
    return (
      <div className="h-full w-full flex flex-col bg-white">
        <div className="flex-1 overflow-auto p-6">
          <pre className="text-sm text-gray-800 font-mono whitespace-pre-wrap">
            {textContent || "Loading..."}
          </pre>
        </div>
      </div>
    );
  }

  if (isPDF) {
    if (!previewUrl) {
      return (
        <div className="h-full w-full flex items-center justify-center bg-gray-50">
          <p className="text-gray-500 text-sm">Unable to load PDF</p>
        </div>
      );
    }

    // 动态导入 PDF 查看器，避免 Hooks 问题
    return (
      <div className="h-full w-full bg-gray-100 flex items-center justify-center">
        <iframe
          src={previewUrl}
          className="w-full h-full"
          title={document.name}
        />
      </div>
    );
  }

  // 不支持的格式
  return (
    <div className="h-full w-full flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
        <p className="text-gray-600 font-medium text-lg">{document.name}</p>
        <p className="text-sm text-gray-400 mt-2">
          {extension?.toUpperCase() || "FILE"} •{" "}
          {formatSize(document.size || 0)}
          {document.updatedAt &&
            ` • ${new Date(document.updatedAt).toLocaleDateString()}`}
        </p>
        {previewUrl && (
          <a
            href={previewUrl}
            download={document.name}
            className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            Download
          </a>
        )}
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

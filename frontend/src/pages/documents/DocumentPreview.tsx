// frontend/src/pages/documents/DocumentPreview.tsx
import { useState, useEffect, type KeyboardEvent } from "react";
import { FileText, Download, X, ZoomIn, Tag } from "lucide-react";
import type { DocumentPreviewProps } from "./types";
import { updateDocumentTags } from "@/api/documents";
import TypingIndicator from "@/components/TypingIndicator";
import { getUserId } from "@/utils/auth";
import { useTypingIndicator } from "@/hooks/useTypingIndicator";

interface TagInputFieldProps {
  tags: string[];
  inputValue: string;
  onInputChange: (val: string) => void;
  onKeyDown: (e: KeyboardEvent<HTMLInputElement>) => void;
  onRemoveTag: (tag: string) => void;
  typingUsers?: { userId: number; username: string; timestamp: string }[];
}

function TagInputField({
  tags,
  inputValue,
  onInputChange,
  onKeyDown,
  onRemoveTag,
  typingUsers = [],
}: TagInputFieldProps) {
  const typingIndicatorUsers: Record<string, any> = {};

  if (typingUsers.length > 0) {
    const latest = typingUsers.reduce(
      (prev: any, current: any) =>
        prev.timestamp > current.timestamp ? prev : current,
      typingUsers[0],
    );
    typingIndicatorUsers["tag-input"] = latest;
  }

  return (
    <div className="border-b border-gray-200 bg-gray-50/50 p-4 space-y-3 shrink-0">
      <div className="flex items-center gap-2 border border-gray-200 rounded-md px-3 py-1.5 bg-white focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition-all">
        <Tag className="w-4 h-4 text-gray-400 shrink-0" />
        <input
          type="text"
          value={inputValue}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={
            tags.length === 0
              ? "Add tags (press Enter to confirm)..."
              : "Add more..."
          }
          className="flex-1 bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none"
        />
      </div>

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <div key={tag} className="relative group">
              <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm">
                {tag}
              </span>
              <button
                type="button"
                onClick={() => onRemoveTag(tag)}
                className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow-sm border border-white"
                title={`Remove "${tag}"`}
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <TypingIndicator
        editingUsers={typingIndicatorUsers}
        fieldName="tag-input"
      />
    </div>
  );
}

export default function DocumentPreview({
  document,
  sendWsMessage,
  typingUsers,
  onDocumentUpdated,
}: DocumentPreviewProps) {
  const [textContent, setTextContent] = useState<string>("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isZoomed, setIsZoomed] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState("");
  const currentUserId = getUserId() ?? 0;
  const { sendTypingIndicator } = useTypingIndicator({
    projectId: document?.projectId || 0,
    substepId: document ? `doc-${document.id}` : "",
    currentUserId,
    sendWsMessage,
  });

  useEffect(() => {
    setTags(document?.tags || []);
  }, [document?.id, document?.updatedAt, document?.tags]);

  useEffect(() => {
    return () => {
      if (previewUrl?.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  useEffect(() => {
    if (!document) {
      setPreviewUrl(null);
      setTextContent("");
      return;
    }
    if (document.url) {
      setPreviewUrl(document.url);
      const ext = document.extension?.toLowerCase();
      const isText = [
        "txt",
        "md",
        "csv",
        "json",
        "xml",
        "html",
        "css",
      ].includes(ext || "");
      if (isText)
        fetch(document.url)
          .then((res) => res.text())
          .then(setTextContent)
          .catch(() => setTextContent("Error loading content"));
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
      if (isText)
        document.file
          .text()
          .then(setTextContent)
          .catch(() => setTextContent(""));
    } else {
      setPreviewUrl(null);
      setTextContent("");
    }
  }, [document]);

  const handleAddTag = async () => {
    const newTag = inputValue.trim();
    if (!newTag || !document || tags.includes(newTag)) {
      setInputValue("");
      return;
    }
    const newTags = [...tags, newTag];
    setTags(newTags);
    setInputValue("");
    try {
      await updateDocumentTags(document.projectId, document.id, newTags);
      if (onDocumentUpdated)
        onDocumentUpdated({
          ...document,
          tags: newTags,
          updatedAt: new Date().toISOString(),
        });
    } catch (error) {
      console.error("Failed to update tags:", error);
      setTags(tags);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === "," || e.key === " ") {
      e.preventDefault();
      handleAddTag();
    } else if (e.key === "Backspace" && inputValue === "" && tags.length > 0) {
      handleRemoveTag(tags[tags.length - 1]);
    }
  };

  const handleRemoveTag = async (tagToRemove: string) => {
    if (!document) return;
    if (
      !window.confirm(
        `Are you sure you want to remove the tag "${tagToRemove}"?`,
      )
    )
      return;
    const newTags = tags.filter((t) => t !== tagToRemove);
    setTags(newTags);
    try {
      await updateDocumentTags(document.projectId, document.id, newTags);
      if (onDocumentUpdated)
        onDocumentUpdated({
          ...document,
          tags: newTags,
          updatedAt: new Date().toISOString(),
        });
    } catch (error) {
      console.error("Failed to update tags:", error);
      setTags(tags);
    }
  };

  const handleInputChange = (val: string) => {
    setInputValue(val);
    if (document) {
      sendTypingIndicator("tag-input");
    }
  };

  const extension = document?.extension?.toLowerCase();
  const isImage = ["png", "jpg", "jpeg", "gif", "svg", "webp"].includes(
    extension || "",
  );
  const isText = ["txt", "md", "csv", "json", "xml", "html", "css"].includes(
    extension || "",
  );
  const isPDF = extension === "pdf";

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
    <div className="h-full w-full flex flex-col bg-gray-50 overflow-hidden">
      <TagInputField
        tags={tags}
        inputValue={inputValue}
        onInputChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onRemoveTag={handleRemoveTag}
        typingUsers={typingUsers}
      />
      <div className="flex-1 min-h-0 overflow-hidden relative">
        {isImage && (
          <>
            {!previewUrl ? (
              <div className="h-full w-full flex items-center justify-center bg-gray-50">
                <p className="text-gray-500 text-sm">Unable to load image</p>
              </div>
            ) : (
              <div
                className="h-full w-full flex items-center justify-center p-4 overflow-hidden cursor-zoom-in group"
                onClick={() => setIsZoomed(true)}
              >
                <img
                  src={previewUrl}
                  alt={document.name}
                  className="block max-h-full max-w-full object-contain rounded-lg shadow-lg transition-transform group-hover:scale-[1.02]"
                />
                <div className="absolute bottom-6 right-6 bg-black/50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                  <ZoomIn className="w-5 h-5" />
                </div>
              </div>
            )}
            {isZoomed && (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 animate-in fade-in duration-200"
                onClick={() => setIsZoomed(false)}
              >
                <button
                  className="absolute top-6 right-6 text-white/70 hover:text-white p-2 transition-colors"
                  onClick={() => setIsZoomed(false)}
                >
                  <X className="w-8 h-8" />
                </button>
                <img
                  src={previewUrl || undefined}
                  alt={document.name}
                  className="max-w-full max-h-full object-contain cursor-zoom-out"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            )}
          </>
        )}
        {isPDF &&
          (!previewUrl ? (
            <div className="h-full w-full flex items-center justify-center bg-gray-50">
              <p className="text-gray-500 text-sm">Unable to load PDF</p>
            </div>
          ) : (
            <iframe
              src={previewUrl}
              className="w-full h-full border-0"
              title={document.name}
            />
          ))}
        {isText && (
          <div className="h-full w-full flex flex-col bg-white overflow-hidden">
            <div className="flex-1 overflow-auto p-6">
              <pre className="text-sm text-gray-800 font-mono whitespace-pre-wrap">
                {textContent || "Loading..."}
              </pre>
            </div>
          </div>
        )}
        {!isImage && !isPDF && !isText && (
          <div className="h-full w-full flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600 font-medium text-lg">
                {document.name}
              </p>
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
                  <Download className="w-4 h-4" /> Download
                </a>
              )}
            </div>
          </div>
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

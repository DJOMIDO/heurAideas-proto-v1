// frontend/src/components/DocumentSelector/DocumentLinkField.tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { X, Link2 } from "lucide-react";
import DocumentSelectorModal from "./DocumentSelectorModal";
import type { DocumentNode } from "@/pages/documents/types";

interface DocumentLinkFieldProps {
  value: string; // 存储 JSON 字符串格式的文档数组
  onChange: (value: string) => void;
  projectId: number;
  placeholder?: string;
}

export default function DocumentLinkField({
  value,
  onChange,
  projectId,
  placeholder = "Select documents...",
}: DocumentLinkFieldProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 解析当前选中的文档（兼容旧数据）
  let selectedDocs: DocumentNode[] = [];
  try {
    if (value && value.startsWith("[")) {
      selectedDocs = JSON.parse(value);
    }
  } catch (e) {
    // 如果解析失败（比如旧版本的纯文本数据），则视为空
    selectedDocs = [];
  }

  const handleConfirm = (newDocs: DocumentNode[]) => {
    // 合并新选择的文档（自动去重）
    const existingIds = new Set(selectedDocs.map((d) => d.id));
    const uniqueNewDocs = newDocs.filter((d) => !existingIds.has(d.id));
    const merged = [...selectedDocs, ...uniqueNewDocs];

    // 提取核心元数据保存为 JSON 字符串
    const metadata = merged.map((d) => ({
      id: d.id,
      name: d.name,
      url: d.url,
    }));
    onChange(JSON.stringify(metadata));
  };

  const handleRemoveDoc = (docId: string) => {
    const updated = selectedDocs.filter((d) => d.id !== docId);
    onChange(JSON.stringify(updated));
  };

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setIsModalOpen(true)}
        className="w-full h-8 text-xs border-dashed border-gray-300 text-gray-600 hover:bg-gray-50 flex items-center justify-center gap-2"
      >
        <Link2 className="w-3 h-3" />
        {selectedDocs.length > 0 ? "Add more documents" : placeholder}
      </Button>

      {selectedDocs.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedDocs.map((doc) => (
            <div
              key={doc.id}
              className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-md border border-blue-200"
            >
              <span className="truncate max-w-[120px]" title={doc.name}>
                {doc.name}
              </span>
              <button
                type="button"
                onClick={() => handleRemoveDoc(doc.id)}
                className="hover:bg-blue-200 rounded-full p-0.5 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <DocumentSelectorModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onConfirm={handleConfirm}
        projectId={projectId}
      />
    </div>
  );
}

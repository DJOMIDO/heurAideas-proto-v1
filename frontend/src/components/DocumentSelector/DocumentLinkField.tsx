// frontend/src/components/DocumentSelector/DocumentLinkField.tsx

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, Link2 } from "lucide-react";
import DocumentSelectorModal from "./DocumentSelectorModal";
import type { DocumentNode } from "@/pages/documents/types";

interface DocumentLinkFieldProps {
  value: string;
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

  const valueRef = useRef(value);
  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  const snapshotIdsRef = useRef<string[]>([]);

  let selectedDocs: DocumentNode[] = [];
  try {
    if (value && value.startsWith("[")) {
      selectedDocs = JSON.parse(value);
    }
  } catch (e) {
    selectedDocs = [];
  }

  useEffect(() => {
    if (isModalOpen) {
      snapshotIdsRef.current = selectedDocs.map((d) => d.id);
    }
  }, [isModalOpen]);

  const handleConfirm = (newDocs: DocumentNode[]) => {
    let latestDocs: DocumentNode[] = [];
    try {
      if (valueRef.current && valueRef.current.startsWith("[")) {
        latestDocs = JSON.parse(valueRef.current);
      }
    } catch (e) {}

    const snapshotSet = new Set(snapshotIdsRef.current);

    const docsAddedByOthers = latestDocs.filter((d) => !snapshotSet.has(d.id));

    const finalDocsMap = new Map<string, DocumentNode>();

    newDocs.forEach((d) => finalDocsMap.set(d.id, d));

    docsAddedByOthers.forEach((d) => {
      if (!finalDocsMap.has(d.id)) {
        finalDocsMap.set(d.id, d);
      }
    });

    const finalDocs = Array.from(finalDocsMap.values());

    const metadata = finalDocs.map((d) => ({
      id: d.id,
      name: d.name,
      url: d.url,
    }));
    onChange(JSON.stringify(metadata));
  };

  const handleRemoveDoc = (docId: string) => {
    let latestDocs: DocumentNode[] = [];
    try {
      if (valueRef.current && valueRef.current.startsWith("[")) {
        latestDocs = JSON.parse(valueRef.current);
      }
    } catch (e) {}

    const updated = latestDocs.filter((d) => d.id !== docId);
    onChange(JSON.stringify(updated));
  };

  const selectedIds = selectedDocs.map((d) => d.id);

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
        initialSelectedIds={selectedIds}
      />
    </div>
  );
}

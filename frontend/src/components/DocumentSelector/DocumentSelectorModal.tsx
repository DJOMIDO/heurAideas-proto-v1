// frontend/src/components/DocumentSelector/DocumentSelectorModal.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Folder,
  FolderOpen,
  FolderTree,
  FileText,
  ChevronRight,
  ChevronDown,
  Loader2,
} from "lucide-react";
import type { DocumentNode } from "@/pages/documents/types";
import { fetchDocuments } from "@/api/documents";

interface DocumentSelectorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (documents: DocumentNode[]) => void;
  projectId: number;
}

export default function DocumentSelectorModal({
  open,
  onOpenChange,
  onConfirm,
  projectId,
}: DocumentSelectorModalProps) {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<DocumentNode[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set(),
  );
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (open && projectId) {
      loadDocuments();
    }
  }, [open, projectId]);

  const loadDocuments = async () => {
    setIsLoading(true);
    try {
      const data = await fetchDocuments(projectId);
      setDocuments(data);
      const firstLevelFolders = data
        .filter((d) => d.type === "folder")
        .map((d) => d.id);
      setExpandedFolders(new Set(firstLevelFolders));
    } catch (error) {
      console.error("Failed to load documents:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFolder = (id: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleFileSelection = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const getSelectedDocuments = (
    nodes: DocumentNode[],
    ids: Set<string>,
  ): DocumentNode[] => {
    const result: DocumentNode[] = [];
    for (const node of nodes) {
      if (node.type === "file" && ids.has(node.id)) {
        result.push(node);
      }
      if (node.children) {
        result.push(...getSelectedDocuments(node.children, ids));
      }
    }
    return result;
  };

  const handleConfirm = () => {
    const selectedDocs = getSelectedDocuments(documents, selectedIds);
    onConfirm(selectedDocs);
    onOpenChange(false);
    setSelectedIds(new Set());
  };

  const handleCancel = () => {
    onOpenChange(false);
    setSelectedIds(new Set());
  };

  const handleGoToDocumentTree = () => {
    onOpenChange(false);
    navigate("/documents");
  };

  const renderNode = (node: DocumentNode, level = 0) => {
    const isExpanded = expandedFolders.has(node.id);
    const isSelected = selectedIds.has(node.id);

    if (node.type === "folder") {
      return (
        <div key={node.id}>
          <div
            className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 cursor-pointer transition-colors rounded-sm"
            style={{ paddingLeft: `${level * 20 + 12}px` }}
            onClick={() => toggleFolder(node.id)}
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-gray-500 shrink-0" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-500 shrink-0" />
            )}
            {isExpanded ? (
              <FolderOpen className="w-5 h-5 text-blue-600 shrink-0" />
            ) : (
              <Folder className="w-5 h-5 text-blue-600 shrink-0" />
            )}
            <span className="text-sm font-medium text-gray-900 truncate">
              {node.name}
            </span>
          </div>
          {isExpanded && node.children && (
            <div>
              {node.children.map((child) => renderNode(child, level + 1))}
            </div>
          )}
        </div>
      );
    }

    return (
      <div
        key={node.id}
        className={`flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors rounded-sm ${
          isSelected ? "bg-blue-50" : "hover:bg-gray-100"
        }`}
        style={{ paddingLeft: `${level * 20 + 36}px` }}
        onClick={() => toggleFileSelection(node.id)}
      >
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => {}}
          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 shrink-0"
        />
        <FileText className="w-5 h-5 text-gray-400 shrink-0" />
        <span
          className={`text-sm truncate ${isSelected ? "font-medium text-blue-700" : "text-gray-700"}`}
        >
          {node.name}
        </span>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col bg-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-900">
            Select Project Documents
          </DialogTitle>
          <p className="text-sm text-gray-600 mt-1">
            Choose documents to link to this page
          </p>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto border border-gray-200 rounded-lg mt-4 bg-white">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : documents.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <Folder className="w-12 h-12 mb-2 opacity-50" />
              <p className="text-sm">No documents available</p>
            </div>
          ) : (
            <div className="py-2">
              {documents.map((node) => renderNode(node))}
            </div>
          )}
        </div>

        <DialogFooter className="flex items-center justify-between mt-4 sm:justify-between">
          <div className="text-sm text-gray-600">
            {selectedIds.size} document{selectedIds.size !== 1 ? "s" : ""}{" "}
            selected
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleGoToDocumentTree}
              className="flex items-center gap-2 text-gray-700 hover:bg-gray-100"
            >
              <FolderTree className="w-4 h-4" />
              See in Document Tree
            </Button>

            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={selectedIds.size === 0}
              className="bg-gray-900 hover:bg-gray-800 text-white"
            >
              Confirm Selection
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

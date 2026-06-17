// frontend/src/components/DocumentSelector/DocumentSelectorModal.tsx
import { useState, useEffect, useMemo } from "react";
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

  // 👇 新增：Tag 筛选状态
  const [activeTags, setActiveTags] = useState<string[]>([]);

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
      // 默认展开第一层文件夹
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

  // 👇 新增：Tag 切换逻辑
  const toggleTagFilter = (tag: string) => {
    if (tag === "All") {
      setActiveTags([]);
    } else {
      setActiveTags((prev) =>
        prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
      );
    }
  };

  // 👇 新增：提取所有唯一的 Tag
  const allUniqueTags = useMemo(() => {
    const tags = new Set<string>();
    const traverse = (nodes: DocumentNode[]) => {
      nodes.forEach((node) => {
        if (node.tags) {
          node.tags.forEach((t) => tags.add(t));
        }
        if (node.children) {
          traverse(node.children);
        }
      });
    };
    traverse(documents);
    return Array.from(tags).sort();
  }, [documents]);

  // 👇 新增：根据 Tag 过滤文档树
  const filteredDocuments = useMemo(() => {
    if (activeTags.length === 0) return documents;

    const filterNode = (node: DocumentNode): DocumentNode | null => {
      if (node.type === "file") {
        // 文件：检查是否包含任意一个选中的 Tag (OR 逻辑)
        const hasMatchingTag = node.tags?.some((t) => activeTags.includes(t));
        return hasMatchingTag ? node : null;
      } else {
        // 文件夹：递归过滤子节点
        if (!node.children) return null;
        const filteredChildren = node.children
          .map(filterNode)
          .filter((n): n is DocumentNode => n !== null);

        // 只有当文件夹内有匹配的文件（或子文件夹）时，才保留该文件夹
        if (filteredChildren.length > 0) {
          return { ...node, children: filteredChildren };
        }
        return null;
      }
    };

    return documents
      .map(filterNode)
      .filter((n): n is DocumentNode => n !== null);
  }, [documents, activeTags]);

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
    const selectedDocs = getSelectedDocuments(filteredDocuments, selectedIds);
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

    // 文件节点
    return (
      <div
        key={node.id}
        className={`flex items-center justify-between px-3 py-2 cursor-pointer transition-colors rounded-sm ${
          isSelected ? "bg-blue-50" : "hover:bg-gray-100"
        }`}
        style={{ paddingLeft: `${level * 20 + 36}px` }}
        onClick={() => toggleFileSelection(node.id)}
      >
        {/* 左侧：Checkbox + Icon + Name */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => {}}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 shrink-0"
          />
          <FileText className="w-5 h-5 text-gray-400 shrink-0" />
          <span
            className={`text-sm truncate ${
              isSelected ? "font-medium text-blue-700" : "text-gray-700"
            }`}
          >
            {node.name}
          </span>
        </div>

        {/* 右侧：Tags */}
        <div className="flex items-center gap-2 shrink-0 ml-2">
          {node.tags?.map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 bg-pink-100 text-pink-700 border border-pink-200 rounded-full text-[10px] font-medium whitespace-nowrap"
              onClick={(e) => e.stopPropagation()} // 防止点击 Tag 时触发文件选择
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col bg-white p-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-xl font-semibold text-gray-900">
                Select Project Documents
              </DialogTitle>
              <p className="text-sm text-gray-600 mt-1">
                Choose documents to link to this page
              </p>
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              {/* X icon would go here if needed, usually Dialog handles close */}
            </button>
          </div>
        </DialogHeader>

        {/* 👇 Tag 筛选栏 */}
        <div className="px-6 py-3 border-b border-gray-100 bg-gray-50/50 flex items-center gap-3 overflow-x-auto no-scrollbar">
          <span className="text-xs font-semibold text-gray-500 whitespace-nowrap">
            Filter by tag:
          </span>

          {/* "All" Button */}
          <button
            onClick={() => toggleTagFilter("All")}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all whitespace-nowrap border ${
              activeTags.length === 0
                ? "bg-gray-900 text-white border-gray-900 shadow-sm"
                : "bg-white text-gray-600 border-gray-200 hover:bg-gray-100"
            }`}
          >
            All
          </button>

          {/* Dynamic Tag Buttons */}
          {allUniqueTags.map((tag) => (
            <button
              key={tag}
              onClick={() => toggleTagFilter(tag)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all whitespace-nowrap border ${
                activeTags.includes(tag)
                  ? "bg-gray-900 text-white border-gray-900 shadow-sm"
                  : "bg-white text-gray-600 border-gray-200 hover:bg-gray-100"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>

        {/* 文档列表区域 */}
        <div className="flex-1 overflow-y-auto p-2">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <Folder className="w-12 h-12 mb-2 opacity-50" />
              <p className="text-sm">
                {activeTags.length > 0
                  ? "No documents match the selected tags."
                  : "No documents available"}
              </p>
            </div>
          ) : (
            <div className="py-2 space-y-1">
              {filteredDocuments.map((node) => renderNode(node))}
            </div>
          )}
        </div>

        <DialogFooter className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/30 sm:justify-between">
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

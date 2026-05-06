// src/pages/documents/DocumentTree.tsx

import { useState, useEffect } from "react";
import {
  FileText,
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  MoreVertical,
  Trash2,
  Pencil,
  Copy,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { DocumentTreeProps, DocumentNode } from "./types";

interface DocumentTreePropsWithActions extends DocumentTreeProps {
  onRename?: (id: string, newName: string) => void;
  onDelete?: (id: string) => void;
  onDuplicate?: (id: string) => void;
  uploadTargetId?: string | null;
  onUploadTargetChange?: (id: string | null) => void;
  autoExpandFolderId?: string | null;
}

export default function DocumentTree({
  documents,
  selectedId,
  onSelect,
  onToggleFolder,
  onRename,
  onDelete,
  onDuplicate,
  uploadTargetId,
  onUploadTargetChange,
  autoExpandFolderId,
}: DocumentTreePropsWithActions) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set(["folder-1", "folder-2"]),
  );

  // 自动展开逻辑
  useEffect(() => {
    if (autoExpandFolderId) {
      setExpandedFolders((prev) => new Set(prev).add(autoExpandFolderId));
    }
  }, [autoExpandFolderId]);

  // Esc 键取消选中
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onSelect?.(undefined);
        onUploadTargetChange?.(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onSelect, onUploadTargetChange]);

  const toggleFolder = (id: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    onToggleFolder?.(id);
  };

  const handleRename = (node: DocumentNode) => {
    const newName = prompt("Enter new name:", node.name);
    if (newName && newName.trim() !== "" && newName.trim() !== node.name) {
      onRename?.(node.id, newName.trim());
    }
  };

  const handleDelete = (node: DocumentNode) => {
    onDelete?.(node.id);
  };

  const ActionMenu = ({ node }: { node: DocumentNode }) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded transition-all"
          onClick={(e) => e.stopPropagation()} // 阻止冒泡
        >
          <MoreVertical className="w-4 h-4 text-gray-600" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" side="right" sideOffset={4}>
        <DropdownMenuItem
          className="cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            handleRename(node);
          }}
        >
          <Pencil className="w-4 h-4 mr-2" /> Rename
        </DropdownMenuItem>
        {onDuplicate && (
          <DropdownMenuItem
            className="cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              onDuplicate(node.id);
            }}
          >
            <Copy className="w-4 h-4 mr-2" /> Duplicate
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-red-600 cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            handleDelete(node);
          }}
        >
          <Trash2 className="w-4 h-4 mr-2" /> Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const renderNode = (node: DocumentNode, level = 0, isLast = false) => {
    const isExpanded = expandedFolders.has(node.id);
    const isSelected = selectedId === node.id;
    const isUploadTarget = uploadTargetId === node.id;

    // 文件夹点击：阻止冒泡 + 互斥处理
    const handleFolderClick = (e: React.MouseEvent) => {
      e.stopPropagation(); // 阻止事件冒泡到容器
      toggleFolder(node.id);
      if (uploadTargetId === node.id) {
        onUploadTargetChange?.(null);
        onSelect?.(undefined);
      } else {
        onUploadTargetChange?.(node.id);
        onSelect?.(undefined); // 选文件夹时清空文件预览
      }
    };

    // 文件点击：阻止冒泡 + 互斥处理
    const handleFileClick = (e: React.MouseEvent) => {
      e.stopPropagation(); // 阻止事件冒泡到容器
      if (selectedId === node.id) {
        onSelect?.(undefined); // 再次点击取消
      } else {
        onSelect?.(node.id);
        onUploadTargetChange?.(null); // 选文件时清空文件夹目标
      }
    };

    if (node.type === "folder") {
      return (
        <div key={node.id}>
          <div
            className={`group flex items-center gap-2 px-3 py-2 text-base transition-all cursor-pointer ${
              isSelected
                ? "bg-blue-50 text-blue-700 font-medium"
                : isUploadTarget
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200 rounded"
                  : "hover:bg-gray-100 text-gray-900"
            }`}
            style={{ paddingLeft: `${level * 16 + 12}px` }}
          >
            <button
              onClick={handleFolderClick}
              className="flex-1 flex items-center gap-2 text-left"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 shrink-0 text-gray-500" />
              ) : (
                <ChevronRight className="w-4 h-4 shrink-0 text-gray-500" />
              )}
              {isExpanded ? (
                <FolderOpen className="w-4 h-4 shrink-0 text-emerald-600" />
              ) : (
                <Folder className="w-4 h-4 shrink-0 text-blue-600" />
              )}
              <span className="truncate">{node.name}</span>
            </button>
            <ActionMenu node={node} />
          </div>
          {isExpanded &&
            node.children?.map((child, idx) =>
              renderNode(child, level + 1, idx === node.children!.length - 1),
            )}
        </div>
      );
    }

    // File item
    return (
      <div key={node.id}>
        <div
          className={`group flex items-center gap-2 px-3 py-2 text-base transition-all cursor-pointer ${
            isSelected
              ? "bg-blue-50 text-blue-700 font-medium"
              : "hover:bg-gray-100 text-gray-900"
          }`}
          style={{ paddingLeft: `${level * 16 + 36}px` }}
        >
          <button
            onClick={handleFileClick}
            className="flex-1 flex items-center gap-2 text-left"
          >
            <FileText className="w-4 h-4 shrink-0 text-gray-500" />
            <span className="truncate">{node.name}</span>
          </button>
          <ActionMenu node={node} />
        </div>
        {!isLast && (
          <div
            className="mx-4 border-b border-gray-100"
            style={{ marginLeft: `${level * 16 + 36}px` }}
          />
        )}
      </div>
    );
  };

  return (
    <div className="flex-1 overflow-y-auto py-2 bg-white">
      {documents.map((node, idx) =>
        renderNode(node, 0, idx === documents.length - 1),
      )}
    </div>
  );
}

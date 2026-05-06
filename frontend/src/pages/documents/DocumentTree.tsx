// src/pages/documents/DocumentTree.tsx

import { useState } from "react";
import {
  FileText,
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  MoreVertical,
  Trash2,
  Pencil,
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
}

export default function DocumentTree({
  documents,
  selectedId,
  onSelect,
  onToggleFolder,
  onRename,
  onDelete,
}: DocumentTreePropsWithActions) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set(["folder-1", "folder-2"]),
  );

  const toggleFolder = (id: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
    onToggleFolder?.(id);
  };

  const handleRename = (node: DocumentNode) => {
    const newName = prompt("Enter new name:", node.name);
    if (newName && newName.trim() !== "") {
      onRename?.(node.id, newName.trim());
    }
  };

  const handleDelete = (node: DocumentNode) => {
    if (window.confirm(`Are you sure you want to delete "${node.name}"?`)) {
      onDelete?.(node.id);
    }
  };

  const ActionMenu = ({ node }: { node: DocumentNode }) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded transition-all"
          onClick={(e) => e.stopPropagation()}
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
          <Pencil className="w-4 h-4 mr-2" />
          Rename
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-red-600 cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            handleDelete(node);
          }}
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const renderNode = (node: DocumentNode, level = 0, isLast = false) => {
    const isExpanded = expandedFolders.has(node.id);
    const isSelected = selectedId === node.id;

    if (node.type === "folder") {
      return (
        <div key={node.id}>
          <div
            className={`group flex items-center gap-2 px-3 py-2 text-base transition-all cursor-pointer ${
              isSelected
                ? "bg-blue-50 text-blue-700 font-medium"
                : "hover:bg-gray-100 text-gray-900"
            }`}
            style={{ paddingLeft: `${level * 16 + 12}px` }}
          >
            <button
              onClick={() => toggleFolder(node.id)}
              className="flex-1 flex items-center gap-2 text-left"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 shrink-0 text-gray-500" />
              ) : (
                <ChevronRight className="w-4 h-4 shrink-0 text-gray-500" />
              )}
              {isExpanded ? (
                <FolderOpen className="w-4 h-4 shrink-0 text-blue-600" />
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
            onClick={() => onSelect(node.id)}
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

// frontend/src/pages/documents/DocumentManager.tsx

import { useRef, useState, useCallback } from "react";
import { Upload, FolderPlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import AppSidebar from "../overview/AppSidebar";
import DocumentTree from "./DocumentTree";
import DocumentPreview from "./DocumentPreview";
import type { DocumentNode } from "./types";
import { useLocalFileUpload } from "@/hooks/useLocalFileUpload";
import { getUserId } from "@/utils/auth";

// 复用 Menu.tsx 的 localStorage 逻辑，获取当前项目 ID
const getCurrentProjectId = (): number | null => {
  const userId = getUserId();
  const key = userId ? `currentProjectId-${userId}` : "currentProjectId";
  const stored = localStorage.getItem(key);
  return stored ? Number(stored) : null;
};

export default function DocumentManager() {
  // 1. 安全获取当前项目 ID
  const projectId = getCurrentProjectId();

  // 2. 未选择项目时的友好提示
  if (!projectId) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50">
        <div className="text-center space-y-2">
          <p className="text-lg font-semibold text-gray-700">
            No active project
          </p>
          <p className="text-sm text-gray-500">
            Please create or open a project from the Menu.
          </p>
        </div>
      </div>
    );
  }

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [selectedDocId, setSelectedDocId] = useState<string | undefined>();

  // 3. 初始化为空数组 - 用户通过上传/创建来构建树
  const [documents, setDocuments] = useState<DocumentNode[]>([]);

  const [uploadTargetId, setUploadTargetId] = useState<string | null>(null);
  const [autoExpandFolderId, setAutoExpandFolderId] = useState<string | null>(
    null,
  );
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isProcessing, processFiles } = useLocalFileUpload();

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  // 4. 上传文件时自动绑定 projectId
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = processFiles(e.target.files);
    if (newFiles.length > 0) {
      // 强制新文件绑定当前项目
      const filesWithProject = newFiles.map((f) => ({ ...f, projectId }));
      setDocuments((prev) =>
        insertFilesToTarget(prev, filesWithProject, uploadTargetId),
      );
    }
    e.target.value = "";
  };

  // 5. 创建文件夹时自动绑定 projectId
  const handleCreateFolder = useCallback(() => {
    if (!newFolderName.trim()) return;

    const newFolder: DocumentNode = {
      id: `folder-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      name: newFolderName.trim(),
      type: "folder",
      children: [],
      projectId, // 核心绑定
    };

    setDocuments((prev) => {
      const updated = insertFolderToTarget(prev, newFolder, uploadTargetId);

      // 自动展开父文件夹 + 选中新文件夹 + 设为新上传目标
      if (uploadTargetId) {
        setAutoExpandFolderId(uploadTargetId);
        setSelectedDocId(newFolder.id);
        setUploadTargetId(newFolder.id);
      } else {
        setSelectedDocId(newFolder.id);
        setUploadTargetId(newFolder.id);
      }
      return updated;
    });

    setNewFolderName("");
    setIsCreateFolderOpen(false);
  }, [newFolderName, uploadTargetId, projectId]);

  // 递归插入文件到目标文件夹
  const insertFilesToTarget = (
    nodes: DocumentNode[],
    files: DocumentNode[],
    targetId: string | null,
  ): DocumentNode[] => {
    if (!targetId) return [...nodes, ...files];

    return nodes.map((node) => {
      if (node.id === targetId && node.type === "folder") {
        return { ...node, children: [...(node.children || []), ...files] };
      }
      if (node.children) {
        return {
          ...node,
          children: insertFilesToTarget(node.children, files, targetId),
        };
      }
      return node;
    });
  };

  // 递归插入文件夹到目标文件夹
  const insertFolderToTarget = (
    nodes: DocumentNode[],
    folder: DocumentNode,
    targetId: string | null,
  ): DocumentNode[] => {
    if (!targetId) return [...nodes, folder];

    return nodes.map((node) => {
      if (node.id === targetId && node.type === "folder") {
        return { ...node, children: [...(node.children || []), folder] };
      }
      if (node.children) {
        return {
          ...node,
          children: insertFolderToTarget(node.children, folder, targetId),
        };
      }
      return node;
    });
  };

  // 递归重命名（带防重名校验）
  const renameNode = useCallback(
    (
      nodes: DocumentNode[],
      targetId: string,
      newName: string,
      parentId: string | null = null,
    ): { updated: DocumentNode[]; success: boolean; error?: string } => {
      const parent = parentId
        ? findDocumentById(nodes, parentId)
        : { children: nodes };

      if (
        parent?.children?.some((n) => n.id !== targetId && n.name === newName)
      ) {
        return {
          updated: nodes,
          success: false,
          error: "A file/folder with this name already exists",
        };
      }

      const updated = nodes.map((node) => {
        if (node.id === targetId) {
          return {
            ...node,
            name: newName,
            updatedAt: new Date().toISOString(),
          };
        }
        if (node.children) {
          const result = renameNode(node.children, targetId, newName, node.id);
          if (result.success) return { ...node, children: result.updated };
        }
        return node;
      });

      const found = findDocumentById(updated, targetId);
      return {
        updated: found?.name === newName ? updated : nodes,
        success: !!found && found.name === newName,
      };
    },
    [],
  );

  // 递归删除
  const deleteNode = useCallback(
    (nodes: DocumentNode[], targetId: string): DocumentNode[] => {
      return nodes
        .filter((node) => node.id !== targetId)
        .map((node) => {
          if (node.children) {
            return { ...node, children: deleteNode(node.children, targetId) };
          }
          return node;
        });
    },
    [],
  );

  // 处理重命名
  const handleRename = useCallback(
    (id: string, newName: string) => {
      const trimmed = newName.trim();
      if (!trimmed) return;

      const result = renameNode(documents, id, trimmed);
      if (result.success) {
        setDocuments(result.updated);
        if (selectedDocId === id) setSelectedDocId(id);
      } else {
        alert(result.error || "Rename failed");
      }
    },
    [documents, selectedDocId, renameNode],
  );

  // 处理删除
  const handleDelete = useCallback(
    (id: string) => {
      const target = findDocumentById(documents, id);
      if (!target) return;

      if (target.type === "folder" && target.children?.length) {
        if (
          !window.confirm(
            `Delete folder "${target.name}" and all ${target.children.length} item(s) inside?`,
          )
        )
          return;
      } else {
        if (!window.confirm(`Delete "${target.name}"?`)) return;
      }

      setDocuments((prev) => deleteNode(prev, id));

      if (selectedDocId === id) setSelectedDocId(undefined);
      if (uploadTargetId === id) setUploadTargetId(null);
    },
    [documents, selectedDocId, uploadTargetId, deleteNode],
  );

  const selectedDoc = findDocumentById(documents, selectedDocId);

  const getTargetName = (
    nodes: DocumentNode[],
    targetId: string | null,
  ): string => {
    if (!targetId) return "Root";
    const found = findDocumentById(nodes, targetId);
    return found?.name || "Root";
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-white">
      <AppSidebar
        isCollapsed={isSidebarCollapsed}
        onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        onNavigate={(path) => (window.location.href = path)}
      />

      <ResizablePanelGroup orientation="horizontal" className="flex-1">
        <ResizablePanel defaultSize={30} minSize={250} className="bg-gray-50">
          <div className="flex flex-col h-full border-r border-gray-200">
            {/* Header */}
            <div className="h-16 border-b border-gray-200 flex items-center justify-between px-4 bg-white">
              <div className="flex items-center gap-2">
                <h2 className="font-semibold text-gray-800">Document tree</h2>
              </div>
              <div className="flex items-center gap-1">
                <input
                  type="file"
                  multiple
                  ref={fileInputRef}
                  className="hidden"
                  onChange={handleFileChange}
                  disabled={isProcessing}
                />

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                  title="Upload document"
                  onClick={handleUploadClick}
                  disabled={isProcessing}
                >
                  <Upload className="w-4 h-4" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                  title="New folder"
                  onClick={() => setIsCreateFolderOpen(true)}
                >
                  <FolderPlus className="w-4 h-4" />
                </Button>

                {uploadTargetId && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                    title="Clear upload target"
                    onClick={() => setUploadTargetId(null)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Tree Content */}
            <div
              className="flex-1 overflow-y-auto p-2 cursor-default"
              onClick={() => {
                setSelectedDocId(undefined);
                setUploadTargetId(null);
              }}
            >
              <div onClick={(e) => e.stopPropagation()}>
                {/* 空状态提示 */}
                {documents.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400 p-8 text-center">
                    <FolderPlus className="w-12 h-12 mb-4 opacity-50" />
                    <p className="text-sm font-medium text-gray-600">
                      No documents yet
                    </p>
                    <p className="text-xs mt-1 text-gray-500">
                      Upload a file or create a folder to get started
                    </p>
                  </div>
                ) : (
                  <DocumentTree
                    documents={documents}
                    selectedId={selectedDocId}
                    onSelect={setSelectedDocId}
                    uploadTargetId={uploadTargetId}
                    onUploadTargetChange={setUploadTargetId}
                    autoExpandFolderId={autoExpandFolderId}
                    onRename={handleRename}
                    onDelete={handleDelete}
                  />
                )}
              </div>
            </div>
          </div>
        </ResizablePanel>

        <ResizableHandle
          withHandle
          className="w-2 bg-gray-200 hover:bg-gray-400 transition-colors z-10 cursor-col-resize"
        />

        <ResizablePanel
          defaultSize={70}
          className="h-full min-h-0 overflow-hidden bg-white"
        >
          <DocumentPreview document={selectedDoc} />
        </ResizablePanel>
      </ResizablePanelGroup>

      {/* 创建文件夹对话框 */}
      <Dialog open={isCreateFolderOpen} onOpenChange={setIsCreateFolderOpen}>
        <DialogContent className="bg-white border-gray-200">
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Folder name"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreateFolder()}
              autoFocus
            />
            {uploadTargetId && (
              <p className="text-xs text-gray-500 mt-2">
                Will be created inside:{" "}
                <span className="font-medium">
                  {getTargetName(documents, uploadTargetId)}
                </span>
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateFolderOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateFolder}
              disabled={!newFolderName.trim()}
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// 辅助函数：查找文档
function findDocumentById(
  nodes: DocumentNode[],
  id?: string,
): DocumentNode | undefined {
  if (!id) return undefined;
  for (const node of nodes) {
    if (node.id === id) return node;
    if (node.children) {
      const found = findDocumentById(node.children, id);
      if (found) return found;
    }
  }
  return undefined;
}

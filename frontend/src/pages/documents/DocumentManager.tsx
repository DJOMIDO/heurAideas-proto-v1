// frontend/src/pages/documents/DocumentManager.tsx

import { useRef, useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, FolderPlus, X, Loader2 } from "lucide-react";
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
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import AppSidebar from "../overview/AppSidebar";
import DocumentTree from "./DocumentTree";
import DocumentPreview from "./DocumentPreview";
import type { DocumentNode } from "./types";
import { useLocalFileUpload } from "@/hooks/useLocalFileUpload";
import { getUserId, isAuthenticated } from "@/utils/auth";
import { useWebSocket } from "@/hooks/useWebSocket";
import type { WebSocketMessage } from "@/hooks/useWebSocket";
import {
  fetchDocuments,
  uploadDocument,
  createFolder,
  renameNode as renameNodeApi,
  deleteNode as deleteNodeApi,
} from "@/api/documents";

const getCurrentProjectId = (): number | null => {
  const userId = getUserId();
  const key = userId ? `currentProjectId-${userId}` : "currentProjectId";
  const stored = localStorage.getItem(key);
  return stored ? Number(stored) : null;
};

export default function DocumentManager() {
  const navigate = useNavigate();
  useEffect(() => {
    if (!isAuthenticated()) navigate("/auth");
  }, [navigate]);

  const projectId = getCurrentProjectId();
  const currentUserId = getUserId() ?? 0;

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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [documents, setDocuments] = useState<DocumentNode[]>([]);
  const [uploadTargetId, setUploadTargetId] = useState<string | null>(null);
  const [autoExpandFolderId, setAutoExpandFolderId] = useState<string | null>(
    null,
  );
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isProcessing, processFiles } = useLocalFileUpload();
  const [docEditingUsers, setDocEditingUsers] = useState<
    Record<string, { userId: number; username: string; timestamp: string }>
  >({});
  const docEditingTimeoutsRef = useRef<
    Record<string, ReturnType<typeof setTimeout>>
  >({});

  const handleWebSocketMessage = useCallback(
    (msg: WebSocketMessage) => {
      if (msg.type?.startsWith("document.")) {
        if (msg.user_id === currentUserId) return;
        setDocuments((prev) => {
          switch (msg.type) {
            case "document.created":
              return insertNodeToTree(prev, msg.data);
            case "document.updated":
              return updateNodeInTree(prev, msg.data.id, msg.data);
            case "document.deleted":
              return removeNodeFromTree(prev, msg.data.id);
            default:
              return prev;
          }
        });
        return;
      }

      if (msg.type === "user_typing" && msg.substep_id?.startsWith("doc-")) {
        const docId = msg.substep_id.replace("doc-", "");
        const field = msg.field; // "tag-input"
        const key = `${docId}-${field}`;

        if (msg.user_id !== currentUserId) {
          if (docEditingTimeoutsRef.current[key])
            clearTimeout(docEditingTimeoutsRef.current[key]);

          setDocEditingUsers((prev) => ({
            ...prev,
            [key]: {
              userId: msg.user_id,
              username: msg.username || "User",
              timestamp: msg.timestamp || new Date().toISOString(),
            },
          }));

          docEditingTimeoutsRef.current[key] = setTimeout(() => {
            setDocEditingUsers((prev) => {
              const next = { ...prev };
              delete next[key];
              return next;
            });
            delete docEditingTimeoutsRef.current[key];
          }, 3000);
        }
      }
    },
    [currentUserId],
  );

  const { send } = useWebSocket({
    projectId,
    enabled: !!projectId,
    onMessage: handleWebSocketMessage,
  });

  useEffect(() => {
    return () => {
      Object.values(docEditingTimeoutsRef.current).forEach((timeoutId) =>
        clearTimeout(timeoutId),
      );
      docEditingTimeoutsRef.current = {};
    };
  }, []);

  useEffect(() => {
    const loadDocuments = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await fetchDocuments(projectId);
        setDocuments(data);
      } catch (err) {
        console.error("Failed to load documents:", err);
        setError("Failed to load documents. Please try again.");
        setDocuments([]);
      } finally {
        setIsLoading(false);
      }
    };
    loadDocuments();
  }, [projectId]);

  const handleUploadClick = () => fileInputRef.current?.click();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = processFiles(e.target.files);
    if (newFiles.length === 0) return;
    try {
      const filesWithProject = newFiles.map((f) => ({ ...f, projectId }));
      setDocuments((prev) =>
        insertFilesToTarget(prev, filesWithProject, uploadTargetId),
      );
      for (const docNode of newFiles)
        if (docNode.file)
          await uploadDocument(projectId, docNode.file, uploadTargetId);
      const updated = await fetchDocuments(projectId);
      setDocuments(updated);
    } catch (err) {
      console.error("Upload failed:", err);
      alert("Failed to upload file(s). Please try again.");
      const refreshed = await fetchDocuments(projectId);
      setDocuments(refreshed);
    } finally {
      e.target.value = "";
    }
  };

  const handleCreateFolder = useCallback(async () => {
    if (!newFolderName.trim()) return;
    try {
      const tempId = `temp-${Date.now()}`;
      const newFolder: DocumentNode = {
        id: tempId,
        name: newFolderName.trim(),
        type: "folder",
        children: [],
        projectId,
        parentId: uploadTargetId || undefined,
      };
      setDocuments((prev) => {
        const updated = insertFolderToTarget(prev, newFolder, uploadTargetId);
        if (uploadTargetId) setAutoExpandFolderId(uploadTargetId);
        setSelectedDocId(tempId);
        setUploadTargetId(tempId);
        return updated;
      });
      const created = await createFolder(
        projectId,
        newFolderName.trim(),
        uploadTargetId,
      );
      setDocuments((prev) => replaceTempNode(prev, tempId, created));
      setUploadTargetId((prev) => (prev === tempId ? created.id : prev));
      setSelectedDocId((prev) => (prev === tempId ? created.id : prev));
      setAutoExpandFolderId((prev) => (prev === tempId ? created.id : prev));
      setNewFolderName("");
      setIsCreateFolderOpen(false);
    } catch (err) {
      console.error("Create folder failed:", err);
      alert("Failed to create folder. Please try again.");
      const refreshed = await fetchDocuments(projectId);
      setDocuments(refreshed);
    }
  }, [newFolderName, uploadTargetId, projectId]);

  const handleRename = useCallback(
    async (id: string, newName: string) => {
      const trimmed = newName.trim();
      if (!trimmed) return;
      try {
        setDocuments((prev) => {
          const updated = renameNodeLocal(prev, id, trimmed);
          if (selectedDocId === id) setSelectedDocId(id);
          return updated;
        });
        await renameNodeApi(projectId, id, trimmed);
      } catch (err) {
        console.error("Rename failed:", err);
        alert("Failed to rename. Please try again.");
        const refreshed = await fetchDocuments(projectId);
        setDocuments(refreshed);
      }
    },
    [projectId, selectedDocId],
  );

  const handleDelete = useCallback(
    async (id: string) => {
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
      try {
        setDocuments((prev) => deleteNodeLocal(prev, id));
        if (selectedDocId === id) setSelectedDocId(undefined);
        if (uploadTargetId === id) setUploadTargetId(null);
        await deleteNodeApi(projectId, id);
      } catch (err) {
        console.error("Delete failed:", err);
        alert("Failed to delete. Please try again.");
        const refreshed = await fetchDocuments(projectId);
        setDocuments(refreshed);
      }
    },
    [projectId, documents, selectedDocId, uploadTargetId],
  );

  const handleDocumentUpdated = useCallback((updatedDoc: DocumentNode) => {
    setDocuments((prev) => updateNodeInTree(prev, updatedDoc.id, updatedDoc));
  }, []);

  const insertNodeToTree = (
    nodes: DocumentNode[],
    newNode: DocumentNode,
  ): DocumentNode[] => {
    if (!newNode.parentId) return [...nodes, newNode];
    return nodes.map((node) => {
      if (node.id === newNode.parentId && node.type === "folder")
        return { ...node, children: [...(node.children || []), newNode] };
      if (node.children)
        return { ...node, children: insertNodeToTree(node.children, newNode) };
      return node;
    });
  };
  const updateNodeInTree = (
    nodes: DocumentNode[],
    id: string,
    updates: Partial<DocumentNode>,
  ): DocumentNode[] => {
    return nodes.map((node) => {
      if (node.id === id) return { ...node, ...updates };
      if (node.children)
        return {
          ...node,
          children: updateNodeInTree(node.children, id, updates),
        };
      return node;
    });
  };
  const removeNodeFromTree = (
    nodes: DocumentNode[],
    id: string,
  ): DocumentNode[] => {
    return nodes
      .filter((node) => node.id !== id)
      .map((node) => ({
        ...node,
        children: node.children ? removeNodeFromTree(node.children, id) : [],
      }));
  };
  const replaceTempNode = (
    nodes: DocumentNode[],
    tempId: string,
    realNode: DocumentNode,
  ): DocumentNode[] => {
    return nodes.map((node) => {
      if (node.id === tempId) return realNode;
      if (node.children)
        return {
          ...node,
          children: replaceTempNode(node.children, tempId, realNode),
        };
      return node;
    });
  };
  const insertFilesToTarget = (
    nodes: DocumentNode[],
    files: DocumentNode[],
    targetId: string | null,
  ): DocumentNode[] => {
    if (!targetId) return [...nodes, ...files];
    return nodes.map((node) => {
      if (node.id === targetId && node.type === "folder")
        return { ...node, children: [...(node.children || []), ...files] };
      if (node.children)
        return {
          ...node,
          children: insertFilesToTarget(node.children, files, targetId),
        };
      return node;
    });
  };
  const insertFolderToTarget = (
    nodes: DocumentNode[],
    folder: DocumentNode,
    targetId: string | null,
  ): DocumentNode[] => {
    if (!targetId) return [...nodes, folder];
    return nodes.map((node) => {
      if (node.id === targetId && node.type === "folder")
        return { ...node, children: [...(node.children || []), folder] };
      if (node.children)
        return {
          ...node,
          children: insertFolderToTarget(node.children, folder, targetId),
        };
      return node;
    });
  };
  const renameNodeLocal = (
    nodes: DocumentNode[],
    targetId: string,
    newName: string,
    parentId: string | null = null,
  ): DocumentNode[] => {
    const parent = parentId
      ? findDocumentById(nodes, parentId)
      : { children: nodes };
    if (
      parent?.children?.some((n) => n.id !== targetId && n.name === newName)
    ) {
      alert("A file/folder with this name already exists");
      return nodes;
    }
    return nodes.map((node) => {
      if (node.id === targetId)
        return { ...node, name: newName, updatedAt: new Date().toISOString() };
      if (node.children)
        return {
          ...node,
          children: renameNodeLocal(node.children, targetId, newName, node.id),
        };
      return node;
    });
  };
  const deleteNodeLocal = (
    nodes: DocumentNode[],
    targetId: string,
  ): DocumentNode[] => {
    return nodes
      .filter((node) => node.id !== targetId)
      .map((node) => ({
        ...node,
        children: node.children ? deleteNodeLocal(node.children, targetId) : [],
      }));
  };

  const selectedDoc = findDocumentById(documents, selectedDocId);

  const currentDocTypingUsersList = selectedDoc
    ? docEditingUsers[`${selectedDoc.id}-tag-input`]
      ? [docEditingUsers[`${selectedDoc.id}-tag-input`]]
      : []
    : [];

  const getTargetName = (
    nodes: DocumentNode[],
    targetId: string | null,
  ): string => {
    if (!targetId) return "Root";
    const found = findDocumentById(nodes, targetId);
    return found?.name || "Root";
  };

  if (isLoading)
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin text-gray-400" />
          <p className="text-sm text-gray-500">Loading documents...</p>
        </div>
      </div>
    );
  if (error)
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50">
        <div className="text-center space-y-4">
          <p className="text-red-600 font-medium">{error}</p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </div>
    );

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
                  disabled={isProcessing || isLoading}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                  title="Upload document"
                  onClick={handleUploadClick}
                  disabled={isProcessing || isLoading}
                >
                  {isProcessing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                  title="New folder"
                  onClick={() => setIsCreateFolderOpen(true)}
                  disabled={isLoading}
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
                    disabled={isLoading}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
            <div
              className="flex-1 overflow-y-auto p-2 cursor-default"
              onClick={() => {
                setSelectedDocId(undefined);
                setUploadTargetId(null);
              }}
            >
              <div onClick={(e) => e.stopPropagation()}>
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
          <DocumentPreview
            document={selectedDoc}
            sendWsMessage={send}
            typingUsers={currentDocTypingUsersList}
            onDocumentUpdated={handleDocumentUpdated}
          />
        </ResizablePanel>
      </ResizablePanelGroup>

      <Dialog open={isCreateFolderOpen} onOpenChange={setIsCreateFolderOpen}>
        <DialogContent className="bg-white border-gray-200">
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
            <DialogDescription className="text-sm text-gray-500">
              Enter a name for the new folder. It will be created in the
              currently selected location.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Folder name"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreateFolder()}
              autoFocus
              disabled={isLoading}
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
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateFolder}
              disabled={!newFolderName.trim() || isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

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

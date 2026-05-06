// frontend/src/pages/documents/DocumentManager.tsx

import { useState } from "react";
import { Upload, FolderPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
// 🔑 引入 Resizable 组件
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import AppSidebar from "../overview/AppSidebar";
import DocumentTree from "./DocumentTree";
import DocumentPreview from "./DocumentPreview";
import type { DocumentNode } from "./types";

// Mock data
const mockDocuments: DocumentNode[] = [
  {
    id: "folder-1",
    name: "Projet Marketing",
    type: "folder",
    children: [
      {
        id: "file-1",
        name: "presentation.pdf",
        type: "file",
        extension: "pdf",
        size: 2048000,
        updatedAt: "2024-01-15",
      },
      {
        id: "file-2",
        name: "rapport-annuel.pdf",
        type: "file",
        extension: "pdf",
        size: 5120000,
        updatedAt: "2024-01-10",
      },
    ],
  },
  {
    id: "file-3",
    name: "contrat-client.pdf",
    type: "file",
    extension: "pdf",
    size: 1024000,
    updatedAt: "2024-01-20",
  },
  {
    id: "folder-2",
    name: "Documentation",
    type: "folder",
    children: [
      {
        id: "file-4",
        name: "guide-utilisateur.pdf",
        type: "file",
        extension: "pdf",
        size: 3072000,
        updatedAt: "2024-01-18",
      },
      {
        id: "file-5",
        name: "specifications.docx",
        type: "file",
        extension: "docx",
        size: 512000,
        updatedAt: "2024-01-12",
      },
      {
        id: "file-6",
        name: "schema-architecture.png",
        type: "file",
        extension: "png",
        size: 256000,
        updatedAt: "2024-01-08",
      },
    ],
  },
  {
    id: "file-7",
    name: "budget-2026.xlsx",
    type: "file",
    extension: "xlsx",
    size: 128000,
    updatedAt: "2024-01-22",
  },
  {
    id: "file-8",
    name: "notes-reunion.docx",
    type: "file",
    extension: "docx",
    size: 64000,
    updatedAt: "2024-01-25",
  },
];

export default function DocumentManager() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [selectedDocId, setSelectedDocId] = useState<string | undefined>();
  const [documents] = useState<DocumentNode[]>(mockDocuments);

  const selectedDoc = findDocumentById(documents, selectedDocId);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-white">
      <AppSidebar
        isCollapsed={isSidebarCollapsed}
        onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        onNavigate={(path) => (window.location.href = path)}
      />

      {/* 使用 ResizablePanelGroup 替代原来的固定布局 */}
      <ResizablePanelGroup orientation="horizontal" className="flex-1">
        {/* 左侧：文档树面板 */}
        <ResizablePanel defaultSize={30} minSize={250} className="bg-gray-50">
          <div className="flex flex-col h-full border-r border-gray-200">
            {/* Header */}
            <div className="h-16 border-b border-gray-200 flex items-center justify-between px-4 bg-white">
              <h2 className="font-semibold text-gray-800">Document tree</h2>
              <div className="flex items-center gap-1">
                {/* 上传按钮 */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                  title="Upload document"
                >
                  <Upload className="w-4 h-4" />
                </Button>
                {/* 新建文件夹按钮 */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                  title="New folder"
                >
                  <FolderPlus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Tree Content */}
            <div className="flex-1 overflow-y-auto p-2">
              <DocumentTree
                documents={documents}
                selectedId={selectedDocId}
                onSelect={setSelectedDocId}
                onRename={(id, newName) => console.log("Rename:", id, newName)}
                onDelete={(id) => console.log("Delete:", id)}
                onDuplicate={(id) => console.log("Duplicate:", id)}
              />
            </div>
          </div>
        </ResizablePanel>

        {/* 拖拽手柄 */}
        <ResizableHandle
          withHandle
          className="w-2 bg-gray-200 hover:bg-gray-400 transition-colors z-10 cursor-col-resize"
        />

        {/* 右侧：预览面板 */}
        <ResizablePanel defaultSize={70} className="h-full">
          <DocumentPreview document={selectedDoc} />
        </ResizablePanel>
      </ResizablePanelGroup>
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

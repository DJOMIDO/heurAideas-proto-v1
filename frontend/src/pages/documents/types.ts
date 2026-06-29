// frontend/src/pages/documents/types.ts

export interface DocumentNode {
  id: string;
  name: string;
  type: "file" | "folder";
  extension?: string;
  size?: number;
  updatedAt?: string;
  url?: string;
  children?: DocumentNode[];
  file?: File;
  projectId: number;
  parentId?: string;
  tags?: string[];
}

export interface DocumentTreeProps {
  documents: DocumentNode[];
  selectedId?: string;
  onSelect: (id: string | undefined) => void;
  onToggleFolder?: (id: string) => void;
}

export interface DocumentPreviewProps {
  document?: DocumentNode;
  sendWsMessage?: (data: any) => void;
  typingUsers?: { userId: number; username: string; timestamp: string }[];
  onDocumentUpdated?: (updatedDoc: DocumentNode) => void;
}

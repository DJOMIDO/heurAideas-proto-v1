// src/pages/documents/types.ts

export interface DocumentNode {
  id: string;
  name: string;
  type: "file" | "folder";
  extension?: string; // pdf, docx, xlsx, png, etc.
  size?: number; // in bytes
  updatedAt?: string;
  url?: string;
  children?: DocumentNode[]; // for folders
}

export interface DocumentTreeProps {
  documents: DocumentNode[];
  selectedId?: string;
  onSelect: (id: string | undefined) => void;
  onToggleFolder?: (id: string) => void;
}

export interface DocumentPreviewProps {
  document?: DocumentNode;
}

// frontend/src/components/comment/CommentInput.tsx

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { X, Check } from "lucide-react";

interface CommentInputProps {
  position: { x: number; y: number };
  onSave: (content: string) => void;
  onCancel: () => void;
}

export default function CommentInput({
  position,
  onSave,
  onCancel,
}: CommentInputProps) {
  const [content, setContent] = useState("");

  const handleSave = () => {
    if (content.trim()) {
      onSave(content.trim());
      setContent("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      onCancel();
    }
  };

  return (
    <div
      className="fixed z-50 animate-in fade-in zoom-in duration-200"
      style={{
        left: position.x,
        top: position.y,
        transform: "translate(-50%, -100%)",
        marginTop: "-40px",
      }}
    >
      <Card className="w-80 shadow-xl border-gray-200">
        <div className="p-3 space-y-3">
          <Textarea
            placeholder="Add your comment... (Ctrl/Cmd+Enter to save, Esc to cancel)"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
            className="min-h-[100px] resize-none text-sm"
          />

          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancel}
              className="text-gray-600 hover:text-gray-800"
            >
              <X className="w-4 h-4 mr-1" />
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={!content.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Check className="w-4 h-4 mr-1" />
              Save
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

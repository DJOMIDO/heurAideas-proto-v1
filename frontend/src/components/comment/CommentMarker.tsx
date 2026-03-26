// frontend/src/components/comment/CommentMarker.tsx

import { useState, useRef } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { GripVertical } from "lucide-react";
import { type Comment } from "@/types/comment";

interface CommentMarkerProps {
  comment: Comment;
  position: { x: number; y: number };
  onClick: () => void;
  isSelected?: boolean;
  onPositionChange?: (newPos: { x: number; y: number }) => void;
}

export default function CommentMarker({
  comment,
  position,
  onClick,
  isSelected = false,
  onPositionChange,
}: CommentMarkerProps) {
  if (
    !position ||
    typeof position.x !== "number" ||
    typeof position.y !== "number"
  ) {
    return null;
  }

  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const markerRef = useRef<HTMLButtonElement>(null);
  const [localPosition, setLocalPosition] = useState(position);
  const hasDraggedRef = useRef(false);

  // 同步外部 position
  useState(() => {
    if (!hasDraggedRef.current) {
      setLocalPosition(position);
    }
  });

  const handleDragStart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);

    const rect = markerRef.current?.getBoundingClientRect();
    if (rect) {
      dragOffset.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;

    const parentElement = markerRef.current?.parentElement;
    const parentRect = parentElement?.getBoundingClientRect();

    if (parentRect) {
      // 计算相对于父容器的坐标
      setLocalPosition({
        x: e.clientX - parentRect.left,
        y: e.clientY - parentRect.top,
      });
    }
  };

  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false);
      hasDraggedRef.current = true;
      if (onPositionChange) {
        onPositionChange(localPosition);
      }
    }
  };

  // 监听拖拽事件
  if (isDragging) {
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  }

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isDragging) {
      onClick();
    }
  };

  const initials = comment.authorName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <button
      ref={markerRef}
      onClick={handleClick}
      className={`
        absolute z-50 transition-all duration-200
        ${isSelected ? "scale-110" : "scale-100 hover:scale-105"}
        ${isDragging ? "cursor-grabbing" : "cursor-grab"}
      `}
      style={{
        left: localPosition.x,
        top: localPosition.y,
        transform: "translate(-50%, -50%)",
      }}
    >
      <div
        onMouseDown={handleDragStart}
        className={`
          absolute -top-2 left-1/2 -translate-x-1/2
          cursor-grab active:cursor-grabbing
          ${isDragging ? "opacity-100" : "opacity-0 group-hover:opacity-100"}
        `}
      >
        <div className="bg-white/80 rounded-full p-0.5 hover:bg-white shadow-sm">
          <GripVertical className="w-2.5 h-2.5 text-gray-500" />
        </div>
      </div>

      <div
        className={`
          relative p-1 rounded-full shadow-lg
          ${isSelected ? "ring-2 ring-blue-500 ring-offset-2" : "hover:ring-2 hover:ring-blue-300 hover:ring-offset-2"}
          ${comment.resolved ? "bg-gray-100" : "bg-white"}
        `}
      >
        <Avatar className="h-8 w-8">
          <AvatarFallback className="text-xs bg-blue-500 text-white">
            {initials}
          </AvatarFallback>
        </Avatar>

        {!comment.resolved && (
          <span className="absolute -top-1 -right-1 h-3 w-3 bg-blue-500 rounded-full border-2 border-white" />
        )}

        {comment.resolved && (
          <span className="absolute -bottom-1 -right-1 h-4 w-4 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
            <svg
              className="w-2.5 h-2.5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </span>
        )}
      </div>
    </button>
  );
}

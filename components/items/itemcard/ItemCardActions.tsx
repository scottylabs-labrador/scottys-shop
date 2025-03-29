/**
 * Action buttons for item cards in edit mode
 * Provides edit and delete functionality
 */
"use client";

import { Edit, Trash2 } from "lucide-react";

interface ItemCardActionsProps {
  onEdit: (e: React.MouseEvent) => void;
  onDelete: () => void;
  isLoading?: boolean;
}

export default function ItemCardActions({
  onEdit,
  onDelete,
  isLoading = false,
}: ItemCardActionsProps) {
  return (
    <div className="absolute top-0 right-0 p-2 flex flex-col gap-2">
      <button
        onClick={onEdit}
        className="p-2 rounded-full bg-white/90 shadow-md hover:bg-white transition-colors"
        title="Edit item"
        disabled={isLoading}
      >
        <Edit className="w-4 h-4 text-gray-700" />
      </button>
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onDelete();
        }}
        className="p-2 rounded-full bg-white/90 shadow-md hover:bg-white transition-colors"
        title="Delete item"
        disabled={isLoading}
      >
        <Trash2 className="w-4 h-4 text-red-500" />
      </button>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import ItemCard from "@/components/ItemCard";
import { ITEM_TYPE, type AnyItem } from "@/convex/constants";
import ItemModal from "@/components/ItemModal";

interface ItemGridProps {
  title: string;
  items: AnyItem[];
  type: (typeof ITEM_TYPE)[keyof typeof ITEM_TYPE];
  isShopOwner: boolean;
  onDelete?: (itemId: string) => void;
}

const CreateItemCard = ({ onClick }: { onClick: () => void }) => (
  <div className="h-full border-2 border-dashed rounded-lg">
    <Button
      variant="ghost"
      className="w-full h-full flex flex-col items-center justify-center gap-4 hover:bg-transparent"
      onClick={onClick}
    >
      <Plus className="h-12 w-12 stroke-2" />
    </Button>
  </div>
);

export function ItemGrid({
  title,
  items,
  type,
  isShopOwner,
  onDelete,
}: ItemGridProps) {
  const [modalState, setModalState] = useState({
    isOpen: false,
    mode: "create" as "create" | "update",
    item: undefined as AnyItem | undefined,
  });

  const [deleteDialog, setDeleteDialog] = useState({
    isOpen: false,
    itemId: undefined as string | undefined,
  });

  const handleItemClick = (item: AnyItem) => {
    if (isShopOwner) {
      setModalState({
        isOpen: true,
        mode: "update",
        item,
      });
    }
  };

  const handleDeleteClick = (e: React.MouseEvent, itemId: string) => {
    e.stopPropagation();
    setDeleteDialog({
      isOpen: true,
      itemId,
    });
  };

  const confirmDelete = () => {
    if (deleteDialog.itemId && onDelete) {
      onDelete(deleteDialog.itemId);
    }
    setDeleteDialog({ isOpen: false, itemId: undefined });
  };

  return (
    <div className="py-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold">{title}</h3>
        {isShopOwner && (
          <CreateItemCard
            onClick={() =>
              setModalState({ isOpen: true, mode: "create", item: undefined })
            }
          />
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {items.map((item) => (
          <div
            key={item._id}
            className="relative group"
            onClick={() => handleItemClick(item)}
          >
            <ItemCard itemId={item._id} type={type} />
            {isShopOwner && (
              <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <Button
                  variant="secondary"
                  size="icon"
                  className="h-8 w-8 bg-blue-600/50 hover:bg-blue-600/70 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleItemClick(item);
                  }}
                >
                  <Pencil className="h-4 w-4 text-white" />
                </Button>
                <Button
                  variant="secondary"
                  size="icon"
                  className="h-8 w-8 bg-red-600/50 hover:bg-red-600/70 transition-colors"
                  onClick={(e) => handleDeleteClick(e, item._id)}
                >
                  <Trash2 className="h-4 w-4 text-white" />
                </Button>
              </div>
            )}
          </div>
        ))}
        {!isShopOwner && items.length === 0 && (
          <div className="col-span-full text-center py-10 text-muted-foreground">
            No items found
          </div>
        )}
      </div>

      <ItemModal
        isOpen={modalState.isOpen}
        onClose={() =>
          setModalState({ isOpen: false, mode: "create", item: undefined })
        }
        type={type}
        mode={modalState.mode}
        item={modalState.item}
      />

      <AlertDialog
        open={deleteDialog.isOpen}
        onOpenChange={(isOpen) =>
          setDeleteDialog({ isOpen, itemId: undefined })
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this
              item.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import ItemCardImage from "@/components/items/itemcard/ItemCardImage";
import ItemCardDetails from "@/components/items/itemcard/ItemCardDetails";
import ItemCardActions from "@/components/items/itemcard/ItemCardActions";
import DeleteItemDialog from "@/components/items/itemcard/DeleteItemDialog";
import { ITEM_STATUS, ITEM_TYPE } from "@/utils/itemConstants";
import { isItemAvailable } from "@/utils/helperFunctions";
import { User } from "@/utils/types";

interface ItemCardProps {
  itemId: string;
  type: typeof ITEM_TYPE.COMMISSION | typeof ITEM_TYPE.MARKETPLACE;
  isDashboard?: boolean;
  onItemDeleted?: () => void;
  itemData?: any; // Pre-fetched item data
  currentUser?: User | null; // Pass user from parent
}

export default function ItemCard({
  itemId,
  type,
  isDashboard = false,
  onItemDeleted,
  itemData,
  currentUser,
}: ItemCardProps) {
  const [item, setItem] = useState<any | null>(itemData || null);
  const [isHovered, setIsHovered] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isOwnedByUser, setIsOwnedByUser] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const router = useRouter();
  const { toast } = useToast();

  const isCommissionItem = type === ITEM_TYPE.COMMISSION;
  const typePrefix = isCommissionItem ? "comm" : "mp";
  const favoriteItemId = `${typePrefix}_${itemId}`;

  // Set favorites and ownership based on passed user data
  useEffect(() => {
    if (currentUser) {
      const isItemFavorited = currentUser.favorites?.includes(
        favoriteItemId as any
      );
      setIsFavorited(!!isItemFavorited);
    }
  }, [currentUser, favoriteItemId]);

  // Only fetch item data if not provided
  useEffect(() => {
    if (itemData) return;

    const fetchItem = async () => {
      try {
        const response = await fetch(
          `/api/items/${type.toLowerCase()}/${itemId}`
        );
        if (response.ok) {
          const fetchedItem = await response.json();
          setItem(fetchedItem);
        }
      } catch (error) {
        console.error("Error fetching item:", error);
      }
    };

    fetchItem();
  }, [itemId, type, itemData]);

  // Check ownership
  useEffect(() => {
    if (item && currentUser) {
      setIsOwnedByUser(item.sellerId === currentUser.andrewId);
    }
  }, [item, currentUser]);

  if (!item || !item.images || item.images.length === 0) {
    return null;
  }

  const validImages = item.images.filter(
    (url: string) => url && url.trim() !== ""
  );
  if (validImages.length === 0) return null;

  const itemAvailable = isItemAvailable(
    item,
    isCommissionItem ? "commission" : "marketplace"
  );

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!currentUser) {
      toast({
        title: "Authentication required",
        description: "Please sign in to add items to favorites",
      });
      return;
    }

    setIsLoading(true);
    try {
      const action = isFavorited ? "remove" : "add";

      const response = await fetch("/api/users/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId: favoriteItemId, action }),
      });

      if (response.ok) {
        setIsFavorited(!isFavorited);
        toast({
          title: "Success",
          description: isFavorited
            ? "Removed from favorites"
            : "Added to favorites",
        });
      } else {
        throw new Error("Failed to update favorites");
      }
    } catch (error) {
      console.error("Error updating favorites:", error);
      toast({
        title: "Error",
        description: "Failed to update favorites",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    router.push(`/item/edit/${type.toLowerCase()}/${itemId}`);
  };

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/items/${type.toLowerCase()}/${itemId}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        toast({
          title: "Success",
          description: "Item deleted successfully",
        });

        if (onItemDeleted) {
          onItemDeleted();
        } else {
          router.refresh();
        }
      } else {
        throw new Error("Failed to delete item");
      }
    } catch (error) {
      console.error("Error deleting item:", error);
      toast({
        title: "Error",
        description: "Failed to delete item",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsDeleteDialogOpen(false);
    }
  };

  const handleToggleStatus = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isCommissionItem) {
      setIsLoading(true);
      try {
        const newStatus = !item.isAvailable;

        const response = await fetch(
          `/api/items/${type.toLowerCase()}/${itemId}/status`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ isAvailable: newStatus }),
          }
        );

        if (response.ok) {
          setItem({
            ...item,
            isAvailable: newStatus,
          });

          toast({
            title: "Success",
            description: `Commission is now ${newStatus ? "available" : "unavailable"}`,
          });
        } else {
          throw new Error("Failed to update status");
        }
      } catch (error) {
        console.error("Error updating item status:", error);
        toast({
          title: "Error",
          description: "Failed to update item status",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    } else {
      toast({
        title: "Coming Soon",
        description: "Mark as sold functionality will be available soon",
      });
    }
  };

  return (
    <>
      <div
        className="group font-rubik shadow-md relative w-full max-w-[300px] bg-white rounded-lg overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-[1.02]"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <ItemCardImage
          item={item}
          itemId={itemId}
          type={type}
          isHovered={isHovered}
          isFavorited={isFavorited}
          isOwnedByUser={isOwnedByUser}
          isItemAvailable={itemAvailable}
          isDashboard={isDashboard}
          isLoading={isLoading}
          validImages={validImages}
          onFavoriteClick={currentUser ? handleFavoriteClick : undefined}
          onToggleStatus={handleToggleStatus}
          onEdit={handleEdit}
          onDelete={() => setIsDeleteDialogOpen(true)}
        />

        <ItemCardDetails item={item} itemId={itemId} type={type} />

        {isDashboard && (
          <ItemCardActions
            onEdit={handleEdit}
            onDelete={() => setIsDeleteDialogOpen(true)}
          />
        )}
      </div>

      <DeleteItemDialog
        isOpen={isDeleteDialogOpen}
        isLoading={isLoading}
        onClose={() => setIsDeleteDialogOpen(false)}
        onDelete={handleDelete}
      />
    </>
  );
}

/**
 * Primary item card component used across the application
 * Displays an item with image, details, and interactive elements
 */
"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";

// Import sub-components
import ItemCardImage from "./ItemCardImage";
import ItemCardDetails from "./ItemCardDetails";
import ItemCardActions from "./ItemCardActions";
import DeleteItemDialog from "./DeleteItemDialog";

// Import Firebase functions
import {
  getUserByClerkId,
  addToFavorites,
  removeFromFavorites,
} from "@/firebase/users";
import {
  getMPItemById,
  deleteMPItem,
  updateMPItemStatus,
} from "@/firebase/mpItems";
import {
  getCommItemById,
  deleteCommItem,
  updateCommItemAvailability,
} from "@/firebase/commItems";

// Import constants
import { ITEM_STATUS, ITEM_TYPE } from "@/utils/ItemConstants";
import { isItemAvailable } from "@/utils/helpers";

interface ItemCardProps {
  itemId: string;
  type: typeof ITEM_TYPE.COMMISSION | typeof ITEM_TYPE.MARKETPLACE;
  isDashboard?: boolean;
  onItemDeleted?: () => void;
}

export default function ItemCard({
  itemId,
  type,
  isDashboard = false,
  onItemDeleted,
}: ItemCardProps) {
  // State
  const [item, setItem] = useState<any | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isOwnedByUser, setIsOwnedByUser] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Hooks
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useUser();

  // Determine if this is a commission item
  const isCommissionItem = type === ITEM_TYPE.COMMISSION;

  // Create favorite item ID with type prefix
  const typePrefix = isCommissionItem ? "comm" : "mp";
  const favoriteItemId = `${typePrefix}_${itemId}`;

  // Fetch user data and check if item is favorited
  useEffect(() => {
    const fetchUser = async () => {
      if (user?.id) {
        try {
          const userData = await getUserByClerkId(user.id);
          if (userData) {
            setUserId(userData.id);

            // Check if the item is in favorites
            const isItemFavorited =
              userData.favorites &&
              Array.isArray(userData.favorites) &&
              userData.favorites.includes(favoriteItemId);

            setIsFavorited(!!isItemFavorited);
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      }
    };

    fetchUser();
  }, [user?.id, favoriteItemId]);

  // Fetch item data
  useEffect(() => {
    const fetchItem = async () => {
      try {
        const fetchedItem = isCommissionItem
          ? await getCommItemById(itemId)
          : await getMPItemById(itemId);

        setItem(fetchedItem);

        // Check if user owns this item
        if (fetchedItem && userId && fetchedItem.sellerId === userId) {
          setIsOwnedByUser(true);
        }
      } catch (error) {
        console.error("Error fetching item:", error);
      }
    };

    fetchItem();
  }, [itemId, type, userId, isCommissionItem]);

  if (!item || !item.images || item.images.length === 0) {
    return null;
  }

  // Filter out empty image URLs
  const validImages = item.images.filter(
    (url: string) => url && url.trim() !== ""
  );
  if (validImages.length === 0) return null;

  // Check if the item is available
  const itemAvailable = isItemAvailable(
    item,
    isCommissionItem ? "commission" : "marketplace"
  );

  // Handle favoriting/unfavoriting
  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!userId) {
      toast({
        title: "Authentication required",
        description: "Please sign in to add items to favorites",
      });
      return;
    }

    setIsLoading(true);
    try {
      if (isFavorited) {
        await removeFromFavorites(userId, favoriteItemId);
        setIsFavorited(false);
        toast({
          title: "Success",
          description: "Removed from favorites",
        });
      } else {
        await addToFavorites(userId, favoriteItemId);
        setIsFavorited(true);
        toast({
          title: "Success",
          description: "Added to favorites",
        });
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

  // Handle item edit
  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    router.push(`/item/edit/${type.toLowerCase()}/${itemId}`);
  };

  // Handle item delete
  const handleDelete = async () => {
    setIsLoading(true);
    try {
      if (isCommissionItem) {
        await deleteCommItem(itemId);
      } else {
        await deleteMPItem(itemId);
      }

      toast({
        title: "Success",
        description: "Item deleted successfully",
      });

      if (onItemDeleted) {
        onItemDeleted();
      } else {
        router.refresh();
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

  // Handle item status toggle (available/unavailable)
  const handleToggleStatus = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setIsLoading(true);
    try {
      if (isCommissionItem) {
        const commItem = item;
        await updateCommItemAvailability(itemId, !commItem.isAvailable);
        setItem({
          ...commItem,
          isAvailable: !commItem.isAvailable,
        });

        toast({
          title: "Success",
          description: `Commission is now ${!commItem.isAvailable ? "available" : "unavailable"}`,
        });
      } else {
        const mpItem = item;
        const newStatus =
          mpItem.status === ITEM_STATUS.AVAILABLE
            ? ITEM_STATUS.PENDING
            : ITEM_STATUS.AVAILABLE;

        await updateMPItemStatus(itemId, newStatus);
        setItem({
          ...mpItem,
          status: newStatus,
        });

        toast({
          title: "Success",
          description: `Item is now ${newStatus.toLowerCase()}`,
        });
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
  };

  return (
    <>
      <div
        className="group font-rubik shadow-md relative w-full max-w-[300px] bg-white rounded-lg overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-[1.02]"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Image component */}
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
          onFavoriteClick={handleFavoriteClick}
          onToggleStatus={handleToggleStatus}
          onEdit={handleEdit}
          onDelete={() => setIsDeleteDialogOpen(true)}
        />

        {/* Item details component */}
        <ItemCardDetails item={item} itemId={itemId} type={type} />

        {/* Dashboard quick action buttons */}
        {isDashboard && (
          <ItemCardActions
            onEdit={handleEdit}
            onDelete={() => setIsDeleteDialogOpen(true)}
          />
        )}
      </div>

      {/* Delete confirmation dialog */}
      <DeleteItemDialog
        isOpen={isDeleteDialogOpen}
        isLoading={isLoading}
        onClose={() => setIsDeleteDialogOpen(false)}
        onDelete={handleDelete}
      />
    </>
  );
}

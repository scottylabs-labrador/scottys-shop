"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { ITEM_TYPE, MPITEM_STATUS } from '@/utils/constants';
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
  removeFromFavorites 
} from '@/firebase/users';
import { 
  getMPItemById, 
  deleteMPItem, 
  updateMPItemStatus 
} from '@/firebase/mpItems';
import { 
  getCommItemById, 
  deleteCommItem, 
  updateCommItemAvailability 
} from '@/firebase/commItems';

// Define interfaces based on Firebase data models
interface BaseItem {
  id: string;
  title: string;
  price: number;
  images: string[];
  sellerId: string;
}

interface MPItem extends BaseItem {
  condition: string;
  status: typeof MPITEM_STATUS[keyof typeof MPITEM_STATUS];
}

interface CommItem extends BaseItem {
  turnaroundDays: number;
  isAvailable: boolean;
}

type ItemType = typeof ITEM_TYPE[keyof typeof ITEM_TYPE];

interface ItemCardProps {
  itemId: string;
  type: ItemType;
  isDashboard?: boolean;
  onItemDeleted?: () => void;
}

export default function ItemCard({ 
  itemId, 
  type, 
  isDashboard = false,
  onItemDeleted
}: ItemCardProps) {
  // State
  const [item, setItem] = useState<MPItem | CommItem | null>(null);
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

  // Create favorite item ID with type prefix
  const typePrefix = type === ITEM_TYPE.COMMISSION ? "comm" : "mp";
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
            const isItemFavorited = userData.favorites && 
              Array.isArray(userData.favorites) && 
              userData.favorites.includes(favoriteItemId);
              
            setIsFavorited(!!isItemFavorited);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      }
    };
    
    fetchUser();
  }, [user?.id, favoriteItemId]);

  // Fetch item data
  useEffect(() => {
    const fetchItem = async () => {
      try {
        const fetchedItem = type === ITEM_TYPE.COMMISSION
          ? await getCommItemById(itemId)
          : await getMPItemById(itemId);
        
        setItem(fetchedItem);
        
        // Check if user owns this item
        if (fetchedItem && userId && fetchedItem.sellerId === userId) {
          setIsOwnedByUser(true);
        }
      } catch (error) {
        console.error('Error fetching item:', error);
      }
    };
    
    fetchItem();
  }, [itemId, type, userId]);

  if (!item || !item.images || item.images.length === 0) {
    return null;
  }

  // Filter out empty image URLs
  const validImages = item.images.filter(url => url && url.trim() !== "");
  if (validImages.length === 0) return null;

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
          description: "Removed from favorites"
        });
      } else {
        await addToFavorites(userId, favoriteItemId);
        setIsFavorited(true);
        toast({
          title: "Success",
          description: "Added to favorites"
        });
      }
    } catch (error) {
      console.error("Error updating favorites:", error);
      toast({
        title: "Error",
        description: "Failed to update favorites",
        variant: "destructive"
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
      if (type === ITEM_TYPE.COMMISSION) {
        await deleteCommItem(itemId);
      } else {
        await deleteMPItem(itemId);
      }
      
      toast({
        title: "Success",
        description: "Item deleted successfully"
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
        variant: "destructive"
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
      const isCommissionItem = 'turnaroundDays' in item;
      
      if (isCommissionItem) {
        const commItem = item as CommItem;
        await updateCommItemAvailability(itemId, !commItem.isAvailable);
        setItem({
          ...commItem,
          isAvailable: !commItem.isAvailable
        } as CommItem);
        
        toast({
          title: "Success",
          description: `Commission is now ${!commItem.isAvailable ? 'available' : 'unavailable'}`
        });
      } else {
        const mpItem = item as MPItem;
        const newStatus = mpItem.status === MPITEM_STATUS.AVAILABLE 
          ? MPITEM_STATUS.PENDING 
          : MPITEM_STATUS.AVAILABLE;
          
        await updateMPItemStatus(itemId, newStatus);
        setItem({
          ...mpItem,
          status: newStatus
        } as MPItem);
        
        toast({
          title: "Success",
          description: `Item is now ${newStatus.toLowerCase()}`
        });
      }
    } catch (error) {
      console.error("Error updating item status:", error);
      toast({
        title: "Error",
        description: "Failed to update item status",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isCommissionItem = (item: MPItem | CommItem): item is CommItem => {
    return 'turnaroundDays' in item;
  };

  const isItemAvailable = isCommissionItem(item) 
    ? item.isAvailable 
    : item.status === MPITEM_STATUS.AVAILABLE;

  return (
    <>
      <div
        className="group font-rubik shadow-sm relative w-full max-w-[300px] bg-white rounded-lg overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-[1.02]"
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
          isItemAvailable={isItemAvailable}
          isDashboard={isDashboard}
          isLoading={isLoading}
          validImages={validImages}
          onFavoriteClick={handleFavoriteClick}
          onToggleStatus={handleToggleStatus}
          onEdit={handleEdit}
          onDelete={() => setIsDeleteDialogOpen(true)}
        />

        {/* Item details component */}
        <ItemCardDetails 
          item={item}
          itemId={itemId}
          type={type}
        />

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
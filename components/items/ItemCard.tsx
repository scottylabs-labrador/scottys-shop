"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUser } from "@clerk/nextjs";
import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import { ITEM_TYPE, MPITEM_STATUS } from '@/utils/constants';
import { getUserByClerkId, addToFavorites, removeFromFavorites } from '@/firebase/users';
import { getMPItemById } from '@/firebase/mpItems';
import { getCommItemById } from '@/firebase/commItems';

// Define interfaces based on Firebase data models
interface BaseItem {
  id: string;
  title: string;
  price: number;
  images: string[];
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
}

export default function ItemCard({ itemId, type }: ItemCardProps) {
  // State for image carousel and hover effects
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [item, setItem] = useState<MPItem | CommItem | null>(null);
  const [isFavorited, setIsFavorited] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Auth and user state
  const { user } = useUser();

  // Create favorite item ID with type prefix
  const favoriteItemId = `${type === ITEM_TYPE.COMMISSION ? "comm" : "mp"}_${itemId}`;

  // Fetch user data and check if item is favorited
  useEffect(() => {
    const fetchUser = async () => {
      if (user?.id) {
        const userData = await getUserByClerkId(user.id);
        if (userData) {
          setUserId(userData.id);
          setIsFavorited(userData.favorites?.includes(favoriteItemId) || false);
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
      } catch (error) {
        console.error('Error fetching item:', error);
      }
    };
    fetchItem();
  }, [itemId, type]);

  if (!item || item.images.length === 0) {
    return null;
  }

  // Handle image navigation
  const handleImageNav = (e: React.MouseEvent, direction: "prev" | "next") => {
    e.preventDefault();
    e.stopPropagation();

    if (direction === "prev") {
      setCurrentIndex((current) =>
        current === 0 ? item.images.length - 1 : current - 1
      );
    } else {
      setCurrentIndex((current) =>
        current === item.images.length - 1 ? 0 : current + 1
      );
    }
  };

  // Handle favoriting/unfavoriting
  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!userId) {
      return;
    }

    try {
      if (isFavorited) {
        await removeFromFavorites(userId, favoriteItemId);
        setIsFavorited(false);
      } else {
        await addToFavorites(userId, favoriteItemId);
        setIsFavorited(true);
      }
    } catch (error) {
      console.error("Error updating favorites:", error);
      // TODO: Show error toast
    }
  };

  const isCommissionItem = (item: MPItem | CommItem): item is CommItem => {
    return 'turnaroundDays' in item;
  };

  return (
    <div
      className="group font-rubik shadow-sm relative w-full max-w-[300px] bg-white rounded-lg overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-[1.02]"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link href={`/items/${type.toLowerCase()}/${itemId}`}>
        {/* Image container */}
        <div className="relative w-full aspect-square">
          <Image
            src={item.images[currentIndex] || ""}
            alt={`${item.title} ${currentIndex + 1}`}
            fill
            className="object-cover"
            priority={currentIndex === 0}
          />

          {/* Navigation arrows - shown on hover */}
          {item.images.length > 1 && isHovered && (
            <>
              <button
                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 hover:bg-white shadow-md flex items-center justify-center transition-opacity duration-200"
                onClick={(e) => handleImageNav(e, "prev")}
              >
                <ChevronLeft className="w-5 h-5 text-gray-700" />
              </button>
              <button
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 hover:bg-white shadow-md flex items-center justify-center transition-opacity duration-200"
                onClick={(e) => handleImageNav(e, "next")}
              >
                <ChevronRight className="w-5 h-5 text-gray-700" />
              </button>
            </>
          )}

          {/* Favorite button - shown on hover */}
          <SignedIn>
            <button
              className={cn(
                "absolute top-3 right-3 p-2 rounded-full bg-white shadow-md transition-all duration-200 hover:bg-gray-200",
                isFavorited ? "opacity-100" : isHovered ? "opacity-80" : "opacity-0"
              )}
              onClick={handleFavoriteClick}
            >
              <Heart className={cn("w-5 h-5", isFavorited && "fill-rose-500 text-rose-500")} />
            </button>
          </SignedIn>
          <SignedOut>
            <SignInButton>
              <button
                className={cn(
                  "absolute top-3 right-3 p-2 rounded-full bg-white shadow-md transition-all duration-200 hover:bg-gray-200",
                  isHovered ? "opacity-80" : "opacity-0"
                )}
              >
                <Heart className="w-5 h-5" />
              </button>
            </SignInButton>
          </SignedOut>

          {/* Image pagination dots */}
          {item.images.length > 1 && (
            <div
              className={cn(
                "absolute bottom-2 left-0 right-0 flex justify-center gap-1.5 transition-opacity duration-200",
                isHovered ? "opacity-100" : "opacity-0"
              )}
            >
              {item.images.map((_, index) => (
                <button
                  key={index}
                  className={cn(
                    "w-1.5 h-1.5 rounded-full transition-all",
                    index === currentIndex
                      ? "bg-white w-3"
                      : "bg-white/60 hover:bg-white/80"
                  )}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setCurrentIndex(index);
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Item details */}
        <div className="p-3 space-y-1">
          <h3 className="text-md line-clamp-2">{item.title}</h3>

          <div className="flex items-center justify-between">
            <span className="text-lg font-bold text-gray-900">
              ${item.price.toFixed(2)}
            </span>

            {/* Show turnaround days for commission items, condition for marketplace items */}
            {isCommissionItem(item) ? (
              <span className="text-xs font-semibold text-green-700 bg-green-50 px-2 py-1 rounded-full">
                {item.turnaroundDays}d
              </span>
            ) : (
              <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-1 rounded-full">
                {item.condition}
              </span>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}
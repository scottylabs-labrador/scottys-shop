"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { SignedIn, SignedOut, SignInButton, useUser } from "@clerk/nextjs";
import {
  ITEM_TYPE,
  type ItemType,
  type AnyItem,
  isCommissionItem,
} from "@/convex/constants";

// Define component props
interface ItemCardProps {
  itemId: Id<"commItems"> | Id<"mpItems">;
  type: ItemType;
}

export default function ItemCard({ itemId, type }: ItemCardProps) {
  // State for image carousel and hover effects
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Auth and user state
  const { user } = useUser();
  const userId = user?.id as Id<"users">;

  // Create favorite item ID with type prefix
  const favoriteItemId = `${type === ITEM_TYPE.COMMISSION ? "comm" : "mp"}_${itemId}`;

  // Mutations and queries
  const addToFavorites = useMutation(api.users.addFavorite);
  const removeFromFavorites = useMutation(api.users.removeFavorite);

  // Check if item is favorited
  const isFavorited = useQuery(
    api.users.isFavorited,
    userId
      ? {
          userId,
          itemId: favoriteItemId,
        }
      : "skip"
  );

  // Fetch item data based on type
  const item = useQuery(
    type === ITEM_TYPE.COMMISSION ? api.commItems.getById : api.mpItems.getById,
    { itemId: itemId as any }
  );

  // Get image URLs from storage
  const imageUrls =
    useQuery(api.files.getStorageUrls, {
      storageIds: item?.images ?? [],
    }) ?? [];

  // Filter out invalid image URLs
  const validImages = imageUrls.filter(
    (url): url is string => typeof url === "string" && url.trim() !== ""
  );

  if (!item || validImages.length === 0) {
    return null;
  }

  // Handle image navigation
  const handleImageNav = (e: React.MouseEvent, direction: "prev" | "next") => {
    e.preventDefault();
    e.stopPropagation();

    if (direction === "prev") {
      setCurrentIndex((current) =>
        current === 0 ? validImages.length - 1 : current - 1
      );
    } else {
      setCurrentIndex((current) =>
        current === validImages.length - 1 ? 0 : current + 1
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
        await removeFromFavorites({
          userId,
          itemId: favoriteItemId,
        });
      } else {
        await addToFavorites({
          userId,
          itemId: favoriteItemId,
        });
      }
    } catch (error) {
      console.error("Error updating favorites:", error);
      // TODO: Show error toast
    }
  };

  return (
    <div
      className="group font-rubik shadow-sm relative w-full max-w-[300px] bg-white rounded-lg overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-[1.02]"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link href={`/items/${type}/${itemId}`}>
        {/* Image container */}
        <div className="relative w-full aspect-square">
          <Image
            loader={({ src }) => src}
            src={validImages[currentIndex] || ""}
            alt={`${item.title} ${currentIndex + 1}`}
            fill
            className="object-cover"
            priority={currentIndex === 0}
          />

          {/* Navigation arrows - shown on hover */}
          {validImages.length > 1 && isHovered && (
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
            {isFavorited ? (
              <button
                className="absolute top-3 right-3 p-2 rounded-full bg-white shadow-md transition-all duration-200 hover:bg-gray-200"
                onClick={handleFavoriteClick}
              >
                <Heart className="w-5 h-5 fill-rose-500 text-rose-500" />
              </button>
            ) : (
              <button
                className={cn(
                  "absolute top-3 right-3 p-2 rounded-full bg-white shadow-md transition-all duration-200 hover:bg-gray-200",
                  isHovered ? "opacity-80" : "opacity-0"
                )}
                onClick={handleFavoriteClick}
              >
                <Heart className={cn("w-5 h-5")} />
              </button>
            )}
          </SignedIn>
          <SignedOut>
            <SignInButton>
              <button
                className={cn(
                  "absolute top-3 right-3 p-2 rounded-full bg-white shadow-md transition-all duration-200 hover:bg-gray-200",
                  isHovered ? "opacity-80" : "opacity-0"
                )}
                onClick={handleFavoriteClick}
              >
                <Heart className={cn("w-5 h-5")} />
              </button>
            </SignInButton>
          </SignedOut>

          {/* Image pagination dots */}
          {validImages.length > 1 && (
            <div
              className={cn(
                "absolute bottom-2 left-0 right-0 flex justify-center gap-1.5 transition-opacity duration-200",
                isHovered ? "opacity-100" : "opacity-0"
              )}
            >
              {validImages.map((_, index) => (
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

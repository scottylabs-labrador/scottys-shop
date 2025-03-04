"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import { useState } from "react";
import { ITEM_TYPE } from '@/utils/constants';

interface ItemCardImageProps {
  item: any;
  itemId: string;
  type: typeof ITEM_TYPE[keyof typeof ITEM_TYPE];
  isHovered: boolean;
  isFavorited: boolean;
  isOwnedByUser: boolean;
  isItemAvailable: boolean;
  isDashboard: boolean;
  isLoading: boolean;
  validImages: string[];
  onFavoriteClick: (e: React.MouseEvent) => void;
  onToggleStatus: (e: React.MouseEvent) => void;
  onEdit: (e: React.MouseEvent) => void;
  onDelete: () => void;
}

export default function ItemCardImage({
  item,
  itemId,
  type,
  isHovered,
  isFavorited,
  isOwnedByUser,
  isItemAvailable,
  isDashboard,
  isLoading,
  validImages,
  onFavoriteClick,
}: ItemCardImageProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

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

  return (
    <Link href={`/item/${type.toLowerCase()}/${itemId}`}>
      <div className="relative w-full aspect-square">
        <Image
          src={validImages[currentIndex] || ""}
          alt={`${item.title} ${currentIndex + 1}`}
          fill
          className={cn(
            "object-cover",
            !isItemAvailable && "opacity-70 grayscale"
          )}
          priority={currentIndex === 0}
        />

        {/* Status badge for dashboard view */}
        {isDashboard && (
          <div className={cn(
            "absolute top-3 left-3 px-2 py-1 rounded-md text-xs font-medium",
            isItemAvailable 
              ? "bg-green-500 text-white"
              : "bg-gray-500 text-white"
          )}>
            {isItemAvailable ? "Active" : "Inactive"}
          </div>
        )}

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

        {/* Dashboard actions or normal favorite button */}
        {isDashboard ? (
          <div/>
        ) : (
          // Non-dashboard view - show ownership indicator or favorite button
          <>
            {isOwnedByUser ? (
              <div
                className={cn(
                  "absolute top-3 right-3 px-2 py-1 rounded-md bg-black/75 text-white text-xs font-medium transition-all duration-200",
                  isHovered ? "opacity-100" : "opacity-0"
                )}
              >
                Your Item
              </div>
            ) : (
              <>
                <SignedIn>
                  <button
                    className={cn(
                      "absolute top-3 right-3 p-2 rounded-full bg-white shadow-md transition-all duration-200 hover:bg-gray-200",
                      isFavorited ? "opacity-100" : isHovered ? "opacity-80" : "opacity-0"
                    )}
                    onClick={onFavoriteClick}
                    disabled={isLoading}
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
              </>
            )}
          </>
        )}

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
    </Link>
  );
}
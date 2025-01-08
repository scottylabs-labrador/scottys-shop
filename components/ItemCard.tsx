"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  ITEM_TYPE,
  type ItemType,
  type AnyItem,
  isCommissionItem,
} from "@/convex/constants";

interface ItemCardProps {
  itemId: Id<"commItems"> | Id<"mpItems">;
  type: ItemType;
}

export default function ItemCard({ itemId, type }: ItemCardProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const item = useQuery(
    type === ITEM_TYPE.COMMISSION ? api.commItems.getById : api.mpItems.getById,
    { itemId: itemId as any }
  );

  const seller = useQuery(
    api.users.getUserById,
    item?.sellerId ? { id: item.sellerId as Id<"users"> } : "skip"
  );

  const imageUrls =
    useQuery(api.files.getStorageUrls, {
      storageIds: item?.images ?? [],
    }) ?? [];

  const validImages = imageUrls.filter(
    (url): url is string => typeof url === "string" && url.trim() !== ""
  );

  if (!item || validImages.length === 0) {
    return null;
  }

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
    <div
      className="group font-rubik shadow-sm relative w-full max-w-[325px] bg-white rounded-lg overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-[1.02]"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link href={`/items/${type}/${itemId}`}>
        <div className="relative w-full aspect-square">
          <Image
            loader={({ src }) => src}
            src={validImages[currentIndex] || ""}
            alt={`${item.title} ${currentIndex + 1}`}
            fill
            className="object-cover"
            priority={currentIndex === 0}
          />

          {/* Navigation arrows */}
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

          {/* Favorite button */}
          <button
            className={cn(
              "absolute top-3 right-3 p-2 rounded-full bg-white shadow-md transition-opacity duration-200",
              "hover:bg-gray-100",
              isHovered ? "opacity-100" : "opacity-0"
            )}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              // Favorite functionality will be implemented later
            }}
          >
            <Heart className="w-5 h-5 text-gray-700" />
          </button>

          {/* Image navigation dots */}
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

        <div className="p-3 space-y-1">
          <h3 className="text-md line-clamp-2">{item.title}</h3>

          <div className="flex items-center justify-between">
            <span className="text-lg font-bold text-gray-900">
              ${item.price.toFixed(2)}
            </span>

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

"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
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
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);
  const thumbnailContainerRef = useRef<HTMLDivElement>(null);

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

  const updateArrows = () => {
    const container = thumbnailContainerRef.current;
    if (container) {
      setShowLeftArrow(container.scrollLeft > 0);
      setShowRightArrow(
        container.scrollLeft < container.scrollWidth - container.clientWidth - 1
      );
    }
  };

  useEffect(() => {
    updateArrows();
  }, [validImages]);

  useEffect(() => {
    const container = thumbnailContainerRef.current;
    if (container) {
      container.addEventListener("scroll", updateArrows);
      return () => container.removeEventListener("scroll", updateArrows);
    }
  }, []);

  if (!item || validImages.length === 0) {
    return null;
  }

  const handleThumbnailClick = (e: React.MouseEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex(index);
  };

  const scrollThumbnails = (
    e: React.MouseEvent,
    direction: "left" | "right"
  ) => {
    e.preventDefault();
    e.stopPropagation();

    const container = thumbnailContainerRef.current;
    if (container) {
      const scrollAmount = direction === "left" ? -64 : 64;
      container.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  const ItemStatusBadge = () => {
    if (isCommissionItem(item)) {
      return (
        <span className="text-green-800 text-md font-bold">
          {item.turnaroundDays} Day Turnaround
        </span>
      );
    }

    return (
      <span className="text-blue-800 text-md font-bold">{item.condition}</span>
    );
  };

  return (
    <Link
      href={`/items/${type}/${itemId}`}
      className="group block w-full max-w-[325px] bg-white"
    >
      <div className="relative w-full h-[375px]">
        <div className="relative w-full h-[calc(100%-80px)] overflow-hidden">
          <Image
            loader={({ src }) => src}
            src={
              validImages[
                hoveredIndex !== null ? hoveredIndex : currentIndex
              ] || ""
            }
            alt={`${item.title} ${currentIndex + 1}`}
            fill
            className="object-cover transition-transform duration-300"
            priority={currentIndex === 0}
          />
        </div>

        <div className="relative h-20">
          <div className="absolute inset-0">
            <div className="relative h-full flex items-center">
              {showLeftArrow && (
                <button
                  className="absolute left-0 z-10 h-12 w-8 bg-white/80 hover:bg-white flex items-center justify-center"
                  onClick={(e) => scrollThumbnails(e, "left")}
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
              )}

              <div
                ref={thumbnailContainerRef}
                className="w-full flex overflow-x-auto scrollbar-hide py-1 px-1"
                style={{
                  marginTop: "-20px",
                  marginBottom: "-20px",
                  paddingLeft: "2px",
                  paddingRight: "2px",
                }}
              >
                {validImages.map((image, index) => (
                  <div
                    key={index}
                    onClick={(e) => handleThumbnailClick(e, index)}
                    onMouseEnter={() => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    className={cn(
                      "flex-shrink-0 w-8 h-8 relative cursor-pointer select-none",
                      "mr-2 last:mr-0",
                      index === currentIndex &&
                        "ring-1 ring-black ring-offset-1",
                      index !== currentIndex &&
                        "hover:scale-110 transition-transform duration-200 hover:ring-1 hover:ring-gray-400 cursor-pointer"
                    )}
                  >
                    <Image
                      loader={({ src }) => src}
                      src={image}
                      alt={`${item.title} thumbnail ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>

              {showRightArrow && (
                <button
                  className="absolute right-0 h-12 w-8 bg-white/80 hover:bg-white flex items-center justify-center"
                  onClick={(e) => scrollThumbnails(e, "right")}
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="pt-0 space-y-0 w-[calc(100%-1px)]">
        <div>
          <ItemStatusBadge />
        </div>
        <div>
          <p className="pt-2 font-semibold text-base text-gray-900 group-hover:text-gray-700 transition-colors">
            {item.title}
          </p>
          <p className="pt-1 text-xs text-black">{item.category}</p>
        </div>

        <div className="pt-1 flex flex-col gap-1">
          <span className="text-sm text-black">${item.price.toFixed(2)}</span>
        </div>
      </div>
    </Link>
  );
}

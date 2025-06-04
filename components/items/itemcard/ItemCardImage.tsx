/**
 * Image component for item cards
 * Displays the item image with status indicators and action buttons
 */
"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { BadgeAlert, XCircle, CheckCircle } from "lucide-react";
import FavoriteButton from "@/components/items/FavoriteButton";
import { Button } from "@/components/ui/button";

interface ItemCardImageProps {
  item: any;
  itemId: string;
  type: string;
  isHovered: boolean;
  isFavorited: boolean;
  isOwnedByUser: boolean;
  isItemAvailable: boolean;
  isDashboard?: boolean;
  isLoading: boolean;
  validImages: string[];
  onFavoriteClick?: (e: React.MouseEvent) => void;
  onToggleStatus?: (e: React.MouseEvent) => void;
  onEdit?: (e: React.MouseEvent) => void;
  onDelete?: () => void;
}

export default function ItemCardImage({
  item,
  itemId,
  type,
  isHovered,
  isFavorited,
  isOwnedByUser,
  isItemAvailable,
  isDashboard = false,
  isLoading,
  validImages,
  onFavoriteClick,
  onToggleStatus,
}: ItemCardImageProps) {
  return (
    <div className="relative aspect-square">
      <Link
        href={`/item/${type.toLowerCase()}/${itemId}`}
        className="block h-full"
      >
        <div className="relative w-full h-full overflow-hidden">
          <Image
            src={validImages[0]}
            alt={item.title}
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            fill
            sizes="(max-width: 768px) 50vw, 33vw"
          />

          {/* Status Indicator */}
          {!isItemAvailable && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <div className="bg-white/90 px-3 py-2 rounded-full flex items-center gap-2">
                <BadgeAlert className="w-4 h-4 text-red-500" />
                <span className="text-xs font-medium">Unavailable</span>
              </div>
            </div>
          )}

          {/* Dashboard status toggle button */}
          {isDashboard && isOwnedByUser && onToggleStatus && (
            <Button
              className={cn(
                "absolute bottom-2 left-1/2 -translate-x-1/2 text-xs py-1 px-3 h-8 opacity-0 group-hover:opacity-100 transition-opacity duration-200",
                isItemAvailable
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-green-600 hover:bg-green-700"
              )}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (onToggleStatus) onToggleStatus(e);
              }}
              disabled={isLoading}
            >
              {isItemAvailable ? (
                <>
                  <XCircle className="w-3 h-3 mr-1" /> Mark Unavailable
                </>
              ) : (
                <>
                  <CheckCircle className="w-3 h-3 mr-1" /> Mark Available
                </>
              )}
            </Button>
          )}
        </div>
      </Link>

      {/* Favorite Button */}
      {!isOwnedByUser && (
        <div
          className={cn(
            "absolute top-2 right-2 z-10 transition-opacity duration-200",
            isFavorited
              ? "opacity-100"
              : isHovered
                ? "opacity-100"
                : "opacity-0"
          )}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <FavoriteButton
            isFavorited={isFavorited}
            isLoading={isLoading}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onFavoriteClick?.(e);
            }}
          />
        </div>
      )}

      {/* Item owner indicator */}
      {isOwnedByUser && !isDashboard && (
        <div className="absolute top-2 right-2 bg-black/75 text-white px-2 py-1 text-xs font-medium rounded-md">
          Your Item
        </div>
      )}
    </div>
  );
}

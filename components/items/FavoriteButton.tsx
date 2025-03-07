"use client";
// CLAUDE IS THE GOAT!
import { useState } from "react";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";

interface FavoriteButtonProps {
  isFavorited: boolean;
  isLoading: boolean;
  onClick: (e: React.MouseEvent) => void;
  className?: string;
}

export default function FavoriteButton({
  isFavorited,
  isLoading,
  onClick,
  className,
}: FavoriteButtonProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    if (!isLoading) {
      setIsAnimating(true);
      onClick(e);

      // Reset animation state after animation completes
      setTimeout(() => {
        setIsAnimating(false);
      }, 700); // Match this to the animation duration
    }
  };

  return (
    <button
      type="button" // Explicitly add button type
      className={cn(
        "relative p-2 rounded-full bg-white shadow-md transition-all duration-200",
        "hover:bg-gray-200 active:scale-90 disabled:opacity-50",
        isLoading ? "cursor-not-allowed" : "cursor-pointer", // Explicitly set cursor
        className
      )}
      onClick={handleClick}
      disabled={isLoading}
      aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
      style={{ pointerEvents: isLoading ? "none" : "auto" }} // Ensure pointer events work
    >
      {/* Heart icon */}
      <Heart
        className={cn(
          "w-5 h-5 transition-colors duration-300",
          isFavorited && "fill-rose-500 text-rose-500",
          isAnimating && isFavorited
            ? "animate-unfavorite"
            : isAnimating && !isFavorited
              ? "animate-favorite"
              : ""
        )}
      />

      {/* Ripple effect when adding to favorites */}
      {isAnimating && !isFavorited && (
        <span className="absolute inset-0 rounded-full animate-heartbeat border-2 border-rose-500 pointer-events-none"></span>
      )}

      {/* Burst effect when favorited */}
      {isAnimating && isFavorited && (
        <>
          <span className="absolute inset-0 animate-scale-up bg-rose-200 rounded-full opacity-0 pointer-events-none"></span>
          {Array.from({ length: 6 }).map((_, i) => (
            <span
              key={i}
              className="absolute w-1 h-1 bg-rose-500 rounded-full animate-particle-out pointer-events-none"
              style={{
                top: "50%",
                left: "50%",
                transform: `rotate(${i * 60}deg) translateY(-10px)`,
              }}
            ></span>
          ))}
        </>
      )}
    </button>
  );
}

"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

interface CarouselProps {
  images: string[];
  title: string;
  containerClassName?: string;
}

export function ImageCarousel({
  images,
  title,
  containerClassName,
}: CarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);
  const thumbnailContainerRef = useRef<HTMLDivElement>(null);

  const imageUrls =
    useQuery(api.files.getStorageUrls, { storageIds: images }) ?? [];
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

  if (validImages.length === 0) return null;

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

  return (
    <div className={cn("relative", containerClassName)}>
      <div className="relative w-full h-[calc(100%-80px)] overflow-hidden">
        <Image
          loader={({ src }) => src}
          src={validImages[currentIndex] || ""}
          alt={`${title} ${currentIndex + 1}`}
          fill
          className="object-cover"
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
                paddingLeft: "2px",
                paddingRight: "2px",
              }}
            >
              {validImages.map((image, index) => (
                <div
                  key={index}
                  onClick={(e) => handleThumbnailClick(e, index)}
                  className={cn(
                    "flex-shrink-0 w-8 h-8 relative cursor-pointer select-none",
                    "mr-2 last:mr-0",
                    index === currentIndex && "ring-1 ring-black ring-offset-1"
                  )}
                >
                  <Image
                    loader={({ src }) => src}
                    src={image}
                    alt={`${title} thumbnail ${index + 1}`}
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
  );
}

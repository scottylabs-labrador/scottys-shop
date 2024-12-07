"use client";

import { useUser } from "@clerk/nextjs";
import { useState, useRef, useEffect } from "react";
import { Id } from "@/convex/_generated/dataModel";
import { api } from "@/convex/_generated/api";
import { useQuery, useMutation } from "convex/react";
import { useParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Clock,
  DollarSign,
  Tag,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { MPITEM_STATUS, ITEM_TYPE, isCommissionItem } from "@/convex/constants";
import Link from "next/link";
import Image from "next/image";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const DEFAULT_AVATAR = "/assets/default-avatar.png";

export default function ItemPage() {
  const params = useParams<{ type: string; id: string }>();
  const { user } = useUser();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const thumbnailContainerRef = useRef<HTMLDivElement>(null);

  // Early return if invalid type
  if (
    params.type !== ITEM_TYPE.COMMISSION &&
    params.type !== ITEM_TYPE.MARKETPLACE
  ) {
    return null;
  }

  const isCommissionType = params.type === ITEM_TYPE.COMMISSION;

  const commissionItem = useQuery(
    api.commItems.getById,
    isCommissionType ? { itemId: params.id as Id<"commItems"> } : "skip"
  );

  const marketplaceItem = useQuery(
    api.mpItems.getById,
    !isCommissionType ? { itemId: params.id as Id<"mpItems"> } : "skip"
  );

  // Determine the active item
  const item = isCommissionType ? commissionItem : marketplaceItem;
  const seller = useQuery(api.users.getUserById, {
    id: item?.sellerId ?? ("skip" as Id<"users">),
  });

  const getFileUrl = useMutation(api.files.getUrl);

  // Get image URLs
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

  // Effect to handle avatar URL
  useEffect(() => {
    const fetchAvatarUrl = async () => {
      if (!seller?.avatarUrl || !seller?.clerkId) return;

      try {
        if (seller.avatarUrl.startsWith("http")) {
          setAvatarUrl(seller.avatarUrl);
        } else {
          const url = await getFileUrl({
            storageId: seller.avatarUrl,
            userId: seller.clerkId,
          });
          setAvatarUrl(url);
        }
      } catch (error) {
        console.error("Error fetching avatar URL:", error);
        setAvatarUrl(DEFAULT_AVATAR);
      }
    };

    fetchAvatarUrl();
  }, [seller?.avatarUrl, seller?.clerkId, getFileUrl]);

  // Early return if data isn't loaded
  if (!item || !seller || validImages.length === 0) return null;

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

  const status = isCommissionItem(item) ? item.isAvailable : item.status;
  const statusText = isCommissionItem(item)
    ? item.isAvailable
      ? "Available"
      : "Unavailable"
    : item.status.charAt(0).toUpperCase() + item.status.slice(1);

  const canPurchase =
    status === MPITEM_STATUS.AVAILABLE ||
    (isCommissionItem(item) && item.isAvailable);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid md:grid-cols-2 gap-8">
        {/* Main Image */}
        <div className="relative w-full h-[600px]">
          <div className="relative w-full h-full overflow-hidden">
            <Image
              loader={({ src }) => src}
              src={validImages[currentIndex] || ""}
              alt={`${item.title} ${currentIndex + 1}`}
              fill
              className="object-cover"
              priority={currentIndex === 0}
            />
          </div>
        </div>

        {/* Item Details */}
        <div className="space-y-6">
          <div>
            <div className="flex justify-between items-start">
              <h1 className="text-3xl font-bold">{item.title}</h1>
              <Badge variant={canPurchase ? "default" : "secondary"}>
                {statusText}
              </Badge>
            </div>
            <p className="text-2xl font-bold mt-2">${item.price.toFixed(2)}</p>
          </div>

          <div className="space-y-4">
            <p className="text-gray-600">{item.description}</p>

            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-muted-foreground" />
              <span>{item.category}</span>
            </div>

            {isCommissionType ? (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>{(item as any).turnaroundDays} days turnaround</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Badge variant="outline">{(item as any).condition}</Badge>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              {item.tags.map((tag: string) => (
                <Badge key={tag} variant="outline">
                  {tag}
                </Badge>
              ))}
            </div>

            {/* Thumbnail Preview */}
            <div className="relative h-20 mt-6">
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
                          "flex-shrink-0 w-16 h-16 relative cursor-pointer select-none",
                          "mr-2 last:mr-0",
                          index === currentIndex &&
                            "ring-1 ring-black ring-offset-1"
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

          {/* Seller Info */}
          <div className="border-t pt-6">
            <h2 className="font-semibold mb-2">Seller</h2>
            <Link href={`/shop/${seller.andrewId}`}>
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={avatarUrl || DEFAULT_AVATAR} />
                  <AvatarFallback>{seller.name[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium !font-bold">{seller.andrewId}</p>
                </div>
              </div>
            </Link>
          </div>

          {/* Action Buttons */}
          <div className="border-t pt-6">
            <Button
              className="w-full mb-3 font-bold"
              size="lg"
              disabled={!canPurchase}
            >
              {isCommissionType ? "Request Commission" : "Purchase Item"}
            </Button>
            <Button variant="outline" className="w-full font-bold" size="lg">
              Contact Seller
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

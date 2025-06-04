"use client";
import { useUser } from "@clerk/nextjs";
import { useState, useRef, useEffect } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChevronUp, ChevronDown, ChevronRight } from "lucide-react";
import FavoriteButton from "@/components/items/FavoriteButton";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { ITEM_STATUS, ITEM_TYPE } from "@/utils/itemConstants";
import { useToast } from "@/hooks/use-toast";
import Loading from "@/components/utils/Loading";
import { StatusBadge, ConditionBadge } from "@/components/items/ItemBadges";
import {
  ItemID,
  User,
  SafeUserData,
  MarketplaceItem,
  CommissionItem,
} from "@/utils/types";

const DEFAULT_AVATAR = "/assets/default-avatar.jpg";

// Union type for items that can be displayed on the item page
type ItemData = MarketplaceItem | CommissionItem;

export default function ItemPage() {
  const params = useParams<{ type: string; id: string }>();
  const { isSignedIn, user } = useUser();
  const { toast } = useToast();

  // Core state
  const [item, setItem] = useState<ItemData | null>(null);
  const [seller, setSeller] = useState<SafeUserData | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isFavorited, setIsFavorited] = useState(false);
  const [isOwnedByUser, setIsOwnedByUser] = useState(false);

  // UI state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showUpArrow, setShowUpArrow] = useState(false);
  const [showDownArrow, setShowDownArrow] = useState(false);
  const [isMainImageHovered, setIsMainImageHovered] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const thumbnailContainerRef = useRef<HTMLDivElement>(null);
  const isCommissionType = params.type === ITEM_TYPE.COMMISSION.toLowerCase();
  const isValidType =
    params.type === ITEM_TYPE.COMMISSION.toLowerCase() ||
    params.type === ITEM_TYPE.MARKETPLACE.toLowerCase();

  // Type guard functions
  const isMarketplaceItem = (item: ItemData): item is MarketplaceItem => {
    return "status" in item && "condition" in item;
  };

  const isCommissionItem = (item: ItemData): item is CommissionItem => {
    return "isAvailable" in item;
  };

  // Fetch current user data
  useEffect(() => {
    const fetchCurrentUser = async () => {
      if (!isSignedIn || !user?.id) return;

      try {
        const response = await fetch("/api/users/current", { method: "POST" });
        if (response.ok) {
          const userData: User = await response.json();
          setCurrentUser(userData);

          // Check if item is favorited
          const favoriteItemId = `${isCommissionType ? "comm" : "mp"}_${params.id}`;
          setIsFavorited(
            userData.favorites?.includes(favoriteItemId as ItemID) || false
          );
        }
      } catch (error) {
        console.error("Error fetching current user:", error);
      }
    };

    fetchCurrentUser();
  }, [isSignedIn, user?.id, params.id, isCommissionType]);

  // Fetch item and seller data
  useEffect(() => {
    const fetchData = async () => {
      if (!isValidType || !params.id) return;

      try {
        // Fetch item data via API
        const itemResponse = await fetch(
          `/api/items/${params.type}/${params.id}`
        );
        if (!itemResponse.ok) {
          toast({
            title: "Error",
            description: "Item not found",
            variant: "destructive",
          });
          return;
        }

        const itemData: ItemData = await itemResponse.json();
        setItem(itemData);

        // Extract AndrewID from seller data and fetch seller info
        const sellerResponse = await fetch(`/api/users/${itemData.sellerId}`);
        if (sellerResponse.ok) {
          const sellerData: SafeUserData = await sellerResponse.json();
          setSeller(sellerData);

          // Check if current user owns this item
          if (currentUser && sellerData.andrewId === currentUser.andrewId) {
            setIsOwnedByUser(true);
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast({
          title: "Error",
          description: "Failed to load item data",
          variant: "destructive",
        });
      }
    };

    fetchData();
  }, [params.type, params.id, isValidType, toast, currentUser]);

  // Handle thumbnail navigation
  useEffect(() => {
    const updateArrows = () => {
      const container = thumbnailContainerRef.current;
      if (container) {
        setShowUpArrow(container.scrollTop > 0);
        setShowDownArrow(
          container.scrollTop <
            container.scrollHeight - container.clientHeight - 1
        );
      }
    };

    const container = thumbnailContainerRef.current;
    if (container) {
      container.addEventListener("scroll", updateArrows);
      updateArrows();
      return () => container.removeEventListener("scroll", updateArrows);
    }
  }, [item?.images]);

  const handleThumbnailClick = (index: number) => {
    setCurrentIndex(index);
  };

  const scrollThumbnails = (direction: "up" | "down") => {
    const container = thumbnailContainerRef.current;
    if (container) {
      const scrollAmount = direction === "up" ? -100 : 100;
      container.scrollBy({ top: scrollAmount, behavior: "smooth" });
    }
  };

  const handleImageNav = (e: React.MouseEvent, direction: "prev" | "next") => {
    e.preventDefault();
    e.stopPropagation();
    if (!item?.images.length) return;

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

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isSignedIn || !currentUser || !item) {
      toast({
        title: "Authentication required",
        description: "Please sign in to add items to favorites",
        variant: "destructive",
      });
      return;
    }

    const favoriteItemId = `${isCommissionType ? "comm" : "mp"}_${params.id}`;

    try {
      setIsLoading(true);
      const action = isFavorited ? "remove" : "add";

      const response = await fetch("/api/users/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId: favoriteItemId, action }),
      });

      if (response.ok) {
        setIsFavorited(!isFavorited);
        toast({
          title: "Success",
          description: isFavorited
            ? "Removed from favorites"
            : "Added to favorites",
        });
      } else {
        throw new Error("Failed to update favorites");
      }
    } catch (error) {
      console.error("Error updating favorites:", error);
      toast({
        title: "Error",
        description: "Failed to update favorites",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isValidType) {
    return (
      <div className="container mx-auto py-8 text-center">
        <h2 className="text-2xl font-semibold">
          Invalid item type: {params.type}
        </h2>
      </div>
    );
  }

  if (!item || !seller) {
    return (
      <div className="container mx-auto py-8 text-center">
        <Loading />
      </div>
    );
  }

  const validImages = item.images.filter((url) => url && url.trim() !== "");

  // Type-safe way to determine availability and status
  const isAvailable = isCommissionItem(item)
    ? item.isAvailable
    : isMarketplaceItem(item)
      ? item.status === ITEM_STATUS.AVAILABLE
      : false;

  const statusText = isCommissionItem(item)
    ? item.isAvailable
      ? ITEM_STATUS.AVAILABLE
      : "Unavailable"
    : isMarketplaceItem(item)
      ? item.status
      : ITEM_STATUS.AVAILABLE;

  return (
    <div className="container mx-auto px-4 py-8 font-rubik max-w-7xl">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        {/* Image Gallery */}
        <div className="grid grid-cols-12 gap-6">
          {/* Thumbnails */}
          <div className="col-span-2">
            <div className="relative h-[600px] flex flex-col">
              {showUpArrow && (
                <button
                  className="absolute top-0 z-10 w-full h-8 bg-white/80 hover:bg-white flex items-center justify-center rounded-t-lg"
                  onClick={() => scrollThumbnails("up")}
                >
                  <ChevronUp className="h-4 w-4" />
                </button>
              )}
              <div
                ref={thumbnailContainerRef}
                className="h-full w-full overflow-y-auto scrollbar-hide space-y-4 px-2 py-2"
              >
                {validImages.map((image, index) => (
                  <div
                    key={index}
                    onClick={() => handleThumbnailClick(index)}
                    className={cn(
                      "w-full aspect-square relative cursor-pointer",
                      "rounded-lg overflow-hidden transition-all duration-200",
                      index === currentIndex
                        ? "ring-2 ring-black ring-offset-2"
                        : "hover:ring-1 hover:ring-gray-300 hover:ring-offset-1"
                    )}
                  >
                    <Image
                      src={image}
                      alt={`Thumbnail ${index + 1}`}
                      fill
                      sizes="(max-width: 768px) 25vw, 10vw"
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
              {showDownArrow && (
                <button
                  className="absolute bottom-0 w-full h-8 bg-white/80 hover:bg-white flex items-center justify-center rounded-b-lg"
                  onClick={() => scrollThumbnails("down")}
                >
                  <ChevronDown className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
          {/* Main Image */}
          <div className="col-span-10">
            <div
              className="relative w-full aspect-square rounded-xl overflow-hidden"
              onMouseEnter={() => setIsMainImageHovered(true)}
              onMouseLeave={() => setIsMainImageHovered(false)}
            >
              {validImages.length > 0 && (
                <Image
                  src={validImages[currentIndex]}
                  alt={`Main image ${currentIndex + 1}`}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover"
                  priority={currentIndex === 0}
                />
              )}
              {validImages.length > 1 && isMainImageHovered && (
                <>
                  <button
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 hover:bg-white shadow-lg flex items-center justify-center"
                    onClick={(e) => handleImageNav(e, "prev")}
                  >
                    <ChevronDown className="w-5 h-5 text-gray-700 rotate-90" />
                  </button>
                  <button
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 hover:bg-white shadow-lg flex items-center justify-center"
                    onClick={(e) => handleImageNav(e, "next")}
                  >
                    <ChevronDown className="w-5 h-5 text-gray-700 -rotate-90" />
                  </button>
                </>
              )}
              {/* Favorite Button - Hidden if user owns the item */}
              {!isOwnedByUser ? (
                <div
                  className={cn(
                    "absolute top-3 right-3 transition-opacity duration-200",
                    isFavorited
                      ? "opacity-100"
                      : isMainImageHovered
                        ? "opacity-80"
                        : "opacity-0"
                  )}
                >
                  <FavoriteButton
                    isFavorited={isFavorited}
                    isLoading={isLoading}
                    onClick={handleFavoriteClick}
                    className="p-3"
                  />
                </div>
              ) : (
                <div
                  className={cn(
                    "absolute top-3 right-3 px-2 py-1 rounded-md bg-black/75 text-white text-xs font-medium transition-all duration-200",
                    isMainImageHovered ? "opacity-100" : "opacity-0"
                  )}
                >
                  Your Item
                </div>
              )}
              {/* Image Navigation Dots */}
              {validImages.length > 1 && (
                <div
                  className={cn(
                    "absolute bottom-6 left-0 right-0 flex justify-center gap-2 transition-all duration-200",
                    isMainImageHovered ? "opacity-100" : "opacity-0"
                  )}
                >
                  {validImages.map((_, index) => (
                    <button
                      key={index}
                      className={cn(
                        "h-1.5 rounded-full transition-all duration-200",
                        index === currentIndex
                          ? "bg-white w-4"
                          : "bg-white/60 w-1.5 hover:bg-white/80"
                      )}
                      onClick={() => setCurrentIndex(index)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        {/* Details Section */}
        <div className="space-y-8">
          <div className="space-y-4">
            <div className="space-y-1">
              <div className="flex justify-between items-start">
                <h1 className="text-3xl font-semibold">{item.title}</h1>
                <StatusBadge status={statusText} />
              </div>
              <div className="flex items-center gap-2 text-sm font-semibold">
                {/* Condition badge - only for marketplace items */}
                {isMarketplaceItem(item) && (
                  <ConditionBadge condition={item.condition} />
                )}
              </div>
            </div>
            <p className="text-gray-600 text-lg font-normal">
              {item.description}
            </p>
            <div className="rounded-2xl border p-6 bg-white shadow-sm">
              <p className="text-4xl font-bold">${item.price.toFixed(2)}</p>
              {/* Action Buttons */}
              <div className="pt-6 space-y-3">
                {isOwnedByUser ? (
                  <Link href={`/item/edit/${params.type}/${params.id}`}>
                    <Button
                      className="w-full font-bold bg-blue-600 hover:bg-blue-700"
                      size="lg"
                    >
                      Edit Item
                    </Button>
                  </Link>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-gray-600">
                      Contact the seller through their shop page
                    </p>
                  </div>
                )}
              </div>
            </div>
            {/* Seller Info */}
            <Link href={`/shop/${seller.andrewId}`}>
              <div className="flex items-center gap-3 pt-3 px-2 group">
                <Avatar className="h-12 w-12 ring-2 ring-offset-2 ring-black">
                  <AvatarImage
                    src={seller.avatarUrl || DEFAULT_AVATAR}
                    className="object-cover"
                  />
                  <AvatarFallback>{seller.username[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="text-sm text-gray-600">@{seller.andrewId}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

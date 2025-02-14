"use client";
import { useUser } from "@clerk/nextjs";
import { useState, useRef, useEffect } from "react";
import { useParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Clock,
  Tag,
  ChevronUp,
  ChevronDown,
  Heart,
  Truck,
  ShieldCheck,
  ChevronRight,
  Star,
  MessageCircle,
  IdCardIcon,
} from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  MPITEM_STATUS,
  ITEM_TYPE,
  isCommissionItem,
  TRANSACTION_STATUS,
} from "@/convex/constants";

const DEFAULT_AVATAR = "/assets/default-avatar.png";

export default function ItemPage() {
  // Core state management
  const params = useParams<{ type: string; id: string }>();
  const { isSignedIn, user } = useUser();
  const userId = user?.id as Id<"users">;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showUpArrow, setShowUpArrow] = useState(false);
  const [showDownArrow, setShowDownArrow] = useState(false);
  const [isMainImageHovered, setIsMainImageHovered] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [newTransId, setNewTransId] = useState<Id<"transactions"> | null>(null);
  const thumbnailContainerRef = useRef<HTMLDivElement>(null);

  // Item type determination
  const isCommissionType = params.type === ITEM_TYPE.COMMISSION;
  const isValidType =
    params.type === ITEM_TYPE.COMMISSION ||
    params.type === ITEM_TYPE.MARKETPLACE;

  // Create favorite item ID with type prefix for storage
  const favoriteItemId = `${params.type === ITEM_TYPE.COMMISSION ? "comm" : "mp"}_${params.id}`;

  // Data fetching queries
  const commissionItem = useQuery(
    api.commItems.getById,
    isCommissionType ? { itemId: params.id as Id<"commItems"> } : "skip"
  );

  const marketplaceItem = useQuery(
    api.mpItems.getById,
    !isCommissionType ? { itemId: params.id as Id<"mpItems"> } : "skip"
  );

  const item = isCommissionType ? commissionItem : marketplaceItem;

  // Attempt at keeping track of active transaction
  const getActive = useQuery(
    api.transactions.getActiveTransaction,
    isSignedIn
      ? {
          buyerId: userId,
          itemId: params.id as Id<"mpItems"> | Id<"commItems">,
        }
      : "skip"
  );
  const [isActive, setIsActive] = useState(getActive ? true : false);

  const seller = useQuery(api.users.getUserById, {
    id: item?.sellerId ?? ("skip" as Id<"users">),
  });

  const getFileUrl = useMutation(api.files.getUrl);

  // Image handling
  const imageUrls =
    useQuery(api.files.getStorageUrls, {
      storageIds: item?.images ?? [],
    }) ?? [];

  const validImages = imageUrls.filter(
    (url): url is string => typeof url === "string" && url.trim() !== ""
  );

  // Favorites functionality
  const addToFavorites = useMutation(api.users.addFavorite);
  const removeFromFavorites = useMutation(api.users.removeFavorite);
  const isFavorited = useQuery(
    api.users.isFavorited,
    userId && item
      ? {
          userId,
          itemId: favoriteItemId,
        }
      : "skip"
  );

  // Cart functionality
  const addToCart = useMutation(api.users.addCart);
  const removeFromCart = useMutation(api.users.removeCart);

  // Update scroll arrows when images change
  useEffect(() => {
    updateArrows();
  }, [validImages]);

  // Setup scroll event listener
  useEffect(() => {
    const container = thumbnailContainerRef.current;
    if (container) {
      container.addEventListener("scroll", updateArrows);
      return () => container.removeEventListener("scroll", updateArrows);
    }
  }, []);

  // Fetch and set seller's avatar
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

  // Thumbnail navigation helpers
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

  // Main image navigation
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

  /// Handle favoriting/unfavoriting
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

  // Transaction handling
  const createTransaction = useMutation(api.transactions.create);
  const updateTransaction = useMutation(api.transactions.update);

  const handleTransaction = async () => {
    if (!user?.id || !item || !seller) return;

    if (!isActive) {
      // !! need to change this boolean to be an actual query check !!
      // Create new transaction
      try {
        const id = await createTransaction({
          userId: user.id,
          sellerId: seller._id,
          itemType: isCommissionType
            ? ITEM_TYPE.COMMISSION
            : ITEM_TYPE.MARKETPLACE,
          itemId: item._id,
          price: item.price,
        });

        await addToCart({
          userId,
          transactionId: id,
        });

        setNewTransId(id);
        console.log("Created transaction with ID: ", id);
      } catch (error) {
        console.error("Error creating transaction: ", error);
      }
    } else {
      // Cancel existing transaction
      if (newTransId === null) {
        console.error(
          "Attempted to unrequest a transaction that should not be active."
        );
      } else {
        try {
          await updateTransaction({
            userId: user.id,
            transactionId: newTransId,
            status: TRANSACTION_STATUS.CANCELLED,
          });

          await removeFromCart({
            userId,
            transactionId: newTransId,
          });

          setNewTransId(null);
        } catch (error) {
          console.error("Error updating transaction status:", error);
        }
      }
    }
    setIsActive(!isActive);
  };

  // Early returns for invalid states
  if (!isValidType) {
    return null;
  }

  if (!item || !seller || validImages.length === 0) {
    return null;
  }

  // Determine item status and purchase availability
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
    <div className="container mx-auto px-4 py-8 font-rubik max-w-7xl">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        {/* Left side - Image gallery */}
        <div className="grid grid-cols-12 gap-6">
          {/* Thumbnail column */}
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
                      loader={({ src }) => src}
                      src={image}
                      alt={`Thumbnail ${index + 1}`}
                      fill
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

          {/* Main image */}
          <div className="col-span-10">
            <div
              className="relative w-full aspect-square rounded-xl overflow-hidden"
              onMouseEnter={() => setIsMainImageHovered(true)}
              onMouseLeave={() => setIsMainImageHovered(false)}
            >
              <Image
                loader={({ src }) => src}
                src={validImages[currentIndex]}
                alt={`Main image ${currentIndex + 1}`}
                fill
                className="object-cover"
                priority={currentIndex === 0}
              />

              {/* Navigation arrows */}
              {validImages.length > 1 && isMainImageHovered && (
                <>
                  <button
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 hover:bg-white shadow-lg flex items-center justify-center transition-all duration-200"
                    onClick={(e) => handleImageNav(e, "prev")}
                  >
                    <ChevronDown className="w-5 h-5 text-gray-700 rotate-90" />
                  </button>
                  <button
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 hover:bg-white shadow-lg flex items-center justify-center transition-all duration-200"
                    onClick={(e) => handleImageNav(e, "next")}
                  >
                    <ChevronDown className="w-5 h-5 text-gray-700 -rotate-90" />
                  </button>
                </>
              )}

              {/* Favorite button - shown on hover */}
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
                    isMainImageHovered ? "opacity-80" : "opacity-0"
                  )}
                  onClick={handleFavoriteClick}
                >
                  <Heart className={cn("w-5 h-5")} />
                </button>
              )}
              {/* Image navigation dots */}
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

        {/* Details section */}
        <div className="space-y-8">
          <div className="space-y-4">
            <div className="space-y-1 ">
              <div className="flex justify-between items-start">
                <h1 className="text-3xl font-semibold">{item.title}</h1>
                <Badge variant={canPurchase ? "default" : "secondary"}>
                  {statusText}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-sm font-semibold">
                {isCommissionType ? (
                  <div className="flex items-center gap-1 rounded-full bg-green-50 px-2 py-1 text-green-700">
                    <Clock className="h-4 w-4 font-bold" />
                    <span>{(item as any).turnaroundDays}d</span>
                  </div>
                ) : (
                  <span className="text-blue-700 bg-blue-50 px-2 py-1 rounded-full">
                    {" "}
                    {(item as any).condition}
                  </span>
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
                <Button
                  onClick={handleTransaction}
                  className={cn(
                    "w-full font-bold",
                    isActive
                      ? "bg-gray-400 hover:bg-slate-500"
                      : "bg-black hover:bg-gray-800"
                  )}
                  size="lg"
                  disabled={!canPurchase}
                >
                  {isActive
                    ? "Unrequest"
                    : isCommissionType
                      ? "Request Commission"
                      : "Purchase Item"}
                </Button>
                <Button
                  className="w-full font-bold text-black bg-white-100 border-2 border-black hover:bg-gray-200"
                  size="lg"
                >
                  Message Seller
                </Button>
              </div>
            </div>

            {/* Seller Info -- TO BE IMPLEMENTED*/}
            <Link href={`/shop/${seller.andrewId}`}>
              <div className="flex items-center gap-3 pt-3 px-2">
                <Avatar className="h-4 w-4 ring-2 ring-offset-2 ring-black">
                  {" "}
                  <AvatarImage src={avatarUrl || DEFAULT_AVATAR} />
                </Avatar>
                <div>
                  <p className="font-semibold text-sm">{seller.andrewId}</p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

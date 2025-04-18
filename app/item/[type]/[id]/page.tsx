"use client";

import { useUser } from "@clerk/nextjs";
import { useState, useRef, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  ChevronUp,
  ChevronDown,
  ChevronRight,
  MessageSquare,
} from "lucide-react";
import FavoriteButton from "@/components/items/FavoriteButton";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { ITEM_STATUS, ITEM_TYPE } from "@/utils/ItemConstants";
import { getCommItemById, type CommItemWithId } from "@/firebase/commItems";
import { getMPItemById, type MPItemWithId } from "@/firebase/mpItems";
import {
  getUserById,
  getUserByClerkId,
  addToFavorites,
  removeFromFavorites,
  type UserWithId,
} from "@/firebase/users";
import {
  createItemPurchaseConversation,
  findConversationByParticipantsAndItem,
  getItemPurchaseMessageTemplate,
} from "@/firebase/conversations";
import { useToast } from "@/hooks/use-toast";
import Loading from "@/components/utils/Loading";

// Import badge components
import {
  StatusBadge,
  TypeBadge,
  ConditionBadge,
  TurnaroundBadge,
} from "@/components/items/ItemBadges";

const DEFAULT_AVATAR = "/assets/default-avatar.png";

type ItemType = CommItemWithId | MPItemWithId;

export default function ItemPage() {
  const params = useParams<{ type: string; id: string }>();
  const { isSignedIn, user } = useUser();
  const { toast } = useToast();
  const router = useRouter();

  // Core state
  const [item, setItem] = useState<ItemType | null>(null);
  const [seller, setSeller] = useState<UserWithId | null>(null);
  const [isFavorited, setIsFavorited] = useState(false);
  const [userFirebaseId, setUserFirebaseId] = useState<string | null>(null);
  const [isOwnedByUser, setIsOwnedByUser] = useState(false);
  const [existingConversationId, setExistingConversationId] = useState<
    string | null
  >(null);

  // UI state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showUpArrow, setShowUpArrow] = useState(false);
  const [showDownArrow, setShowDownArrow] = useState(false);
  const [isMainImageHovered, setIsMainImageHovered] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const thumbnailContainerRef = useRef<HTMLDivElement>(null);

  const isCommissionType = params.type === ITEM_TYPE.COMMISSION.toLowerCase();
  const isValidType =
    params.type === ITEM_TYPE.COMMISSION.toLowerCase() ||
    params.type === ITEM_TYPE.MARKETPLACE.toLowerCase();

  // Get user's Firestore ID from Clerk ID
  useEffect(() => {
    const fetchUserData = async () => {
      if (isSignedIn && user?.id) {
        try {
          const userData = await getUserByClerkId(user.id);
          if (userData) {
            setUserFirebaseId(userData.id);

            // Build favorite item ID
            const favoriteItemId = `${isCommissionType ? "comm" : "mp"}_${params.id}`;
            setIsFavorited(
              userData.favorites?.includes(favoriteItemId) || false
            );
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      }
    };

    fetchUserData();
  }, [isSignedIn, user?.id, params.id, isCommissionType]);

  // Fetch item and seller data
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch item based on type
        const fetchedItem = isCommissionType
          ? await getCommItemById(params.id)
          : await getMPItemById(params.id);

        if (!fetchedItem) {
          toast({
            title: "Error",
            description: "Item not found",
            variant: "destructive",
          });
          return;
        }

        setItem(fetchedItem);

        // Fetch seller data
        const fetchedSeller = await getUserById(fetchedItem.sellerId);
        if (fetchedSeller) {
          setSeller(fetchedSeller);
          setAvatarUrl(fetchedSeller.avatarUrl || DEFAULT_AVATAR);

          // Check if the current user is the seller
          if (userFirebaseId && fetchedSeller.id === userFirebaseId) {
            setIsOwnedByUser(true);
          }
        }

        // Check if conversation already exists for this item
        if (
          isSignedIn &&
          userFirebaseId &&
          fetchedSeller &&
          userFirebaseId !== fetchedSeller.id
        ) {
          try {
            const conversation = await findConversationByParticipantsAndItem(
              userFirebaseId,
              fetchedSeller.id,
              params.id
            );

            if (conversation) {
              setExistingConversationId(conversation.id);
            }
          } catch (error) {
            console.error("Error checking for existing conversation:", error);
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

    if (isValidType && params.id && userFirebaseId) {
      fetchData();
    }
  }, [
    isCommissionType,
    params.id,
    isSignedIn,
    isValidType,
    toast,
    userFirebaseId,
  ]);

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

    if (!isSignedIn || !userFirebaseId || !item) {
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
      if (isFavorited) {
        await removeFromFavorites(userFirebaseId, favoriteItemId);
        setIsFavorited(false);
        toast({
          title: "Success",
          description: "Removed from favorites",
        });
      } else {
        await addToFavorites(userFirebaseId, favoriteItemId);
        setIsFavorited(true);
        toast({
          title: "Success",
          description: "Added to favorites",
        });
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

  const handleRequestToBuy = async () => {
    if (!isSignedIn || !userFirebaseId || !item || !seller) {
      toast({
        title: "Authentication required",
        description: "Please sign in to message the seller",
        variant: "destructive",
      });
      return;
    }

    // If the user already has a conversation about this item, navigate to it
    if (existingConversationId) {
      router.push(`/conversations/${existingConversationId}`);
      return;
    }

    setIsLoading(true);
    try {
      // Create template message based on item availability
      const initialMessage = canPurchase
        ? getItemPurchaseMessageTemplate(
            item.title,
            isCommissionType ? "commission" : "marketplace"
          )
        : `Hi! I'm interested in your ${isCommissionType ? "commission" : "item"} "${item.title}". Do you know when it will be available again?`;

      // Create a new conversation with initial message
      const conversationId = await createItemPurchaseConversation(
        userFirebaseId,
        seller.id,
        params.id,
        isCommissionType ? "commission" : "marketplace",
        initialMessage
      );

      toast({
        title: "Message sent",
        description: "Your message has been sent to the seller",
      });

      // Navigate to the conversation
      router.push(`/conversations/${conversationId}`);
    } catch (error) {
      console.error("Error creating conversation:", error);
      toast({
        title: "Error",
        description: "Failed to send message",
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
  const isAvailable = isCommissionType
    ? (item as CommItemWithId).isAvailable
    : (item as MPItemWithId).status === ITEM_STATUS.AVAILABLE;

  // Get the status string consistently
  const statusText = isCommissionType
    ? (item as CommItemWithId).isAvailable
      ? ITEM_STATUS.AVAILABLE
      : "Unavailable"
    : (item as MPItemWithId).status;

  const canPurchase = isAvailable;

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
                  sizes="(max-width: 768px) 100vw, 50vw" // Add this line
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
                    className="p-3" // Slightly larger button for the item page
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
                {/* Condition or turnaround time badge */}
                {isCommissionType ? (
                  <TurnaroundBadge
                    days={(item as CommItemWithId).turnaroundDays}
                  />
                ) : (
                  <ConditionBadge
                    condition={(item as MPItemWithId).condition}
                  />
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
                ) : existingConversationId ? (
                  // Direct navigation to existing conversation
                  <Button
                    onClick={() =>
                      router.push(`/conversations/${existingConversationId}`)
                    }
                    className="w-full font-bold bg-blue-600 hover:bg-blue-700"
                    size="lg"
                  >
                    <MessageSquare className="w-5 h-5 mr-2" />
                    View Conversation
                  </Button>
                ) : (
                  // Creating a new conversation
                  <Button
                    onClick={async () => {
                      if (!isSignedIn || !userFirebaseId || !item || !seller) {
                        toast({
                          title: "Authentication required",
                          description: "Please sign in to message the seller",
                          variant: "destructive",
                        });
                        return;
                      }

                      setIsLoading(true);
                      try {
                        // Create template message based on item availability
                        const initialMessage = canPurchase
                          ? getItemPurchaseMessageTemplate(
                              item.title,
                              isCommissionType
                                ? ITEM_TYPE.COMMISSION
                                : ITEM_TYPE.MARKETPLACE
                            )
                          : `Hi! I'm interested in your ${isCommissionType ? "commission" : "item"} "${item.title}". Do you know when it will be available again?`;

                        // Create a new conversation with initial message
                        const conversationId =
                          await createItemPurchaseConversation(
                            userFirebaseId,
                            seller.id,
                            params.id,
                            isCommissionType
                              ? ITEM_TYPE.COMMISSION
                              : ITEM_TYPE.MARKETPLACE,
                            initialMessage
                          );

                        toast({
                          title: "Message sent",
                          description:
                            "Your message has been sent to the seller",
                        });

                        // Navigate to the conversation
                        router.push(`/conversations/${conversationId}`);
                      } catch (error) {
                        console.error("Error creating conversation:", error);
                        toast({
                          title: "Error",
                          description: "Failed to send message",
                          variant: "destructive",
                        });
                      } finally {
                        setIsLoading(false);
                      }
                    }}
                    className="w-full font-bold bg-black hover:bg-gray-800"
                    size="lg"
                    disabled={!canPurchase || isLoading}
                  >
                    <MessageSquare className="w-5 h-5 mr-2" />
                    {isLoading ? "Processing..." : "Message Seller"}
                  </Button>
                )}
              </div>
            </div>

            {/* Seller Info */}
            <Link href={`/shop/${seller.andrewId}`}>
              <div className="flex items-center gap-3 pt-3 px-2 group">
                <Avatar className="h-12 w-12 ring-2 ring-offset-2 ring-black">
                  <AvatarImage
                    src={avatarUrl || DEFAULT_AVATAR}
                    className="object-cover"
                  />
                  <AvatarFallback>{seller.name[0]}</AvatarFallback>
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

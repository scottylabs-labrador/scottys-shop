"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import Link from "next/link";
import {
  AlertCircle,
  Clock,
  LayoutDashboard,
  MessageSquare,
  ShoppingCart,
  Tag,
  User,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { type ConversationWithId } from "@/firebase/conversations";
import {
  CONVERSATION_STATUS,
  statusColors,
  statusDisplayNames,
} from "@/utils/ConversationConstants";
import type { ConversationParticipant } from "@/utils/ConversationTypes";
import type { UserWithId } from "@/firebase/users";

const DEFAULT_AVATAR = "/assets/default-avatar.png";
const DEFAULT_ITEM_IMAGE = "/assets/default-item.png";

// Type for combined item data with type information
type ItemWithType = {
  id: string;
  sellerId: string;
  title: string;
  description?: string;
  price: number;
  images: string[];
  type: "marketplace" | "commission";
};

interface ConversationPreviewProps {
  conversation: ConversationWithId;
  otherUser: UserWithId | null;
  item: ItemWithType | null;
  userFirebaseId: string | null;
  activeTab?: string;
  disableLink?: boolean;
}

export default function ConversationPreview({
  conversation,
  otherUser,
  item,
  userFirebaseId,
  activeTab = "all",
  disableLink = false,
}: ConversationPreviewProps) {
  // Determine conversation status
  const isCancelled = [
    CONVERSATION_STATUS.BUYER_CANCELLED,
    CONVERSATION_STATUS.SELLER_CANCELLED,
  ].includes(conversation.status as any);

  const isCompleted = conversation.status === CONVERSATION_STATUS.COMPLETED;
  const isOngoing = conversation.status === CONVERSATION_STATUS.ONGOING;

  // Determine the user's role in this conversation
  const isUserSeller = item ? item.sellerId === userFirebaseId : false;
  const userRole: ConversationParticipant["role"] = isUserSeller
    ? "seller"
    : "buyer";

  // Format relative time (e.g., "2 hours ago")
  const formatRelativeTime = (timestamp: number): string => {
    if (!timestamp) return "recently";

    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch (error) {
      console.error("Error formatting time:", error);
      return "recently";
    }
  };

  // Get preview text for conversation
  const getPreviewText = (): string => {
    if (!conversation.lastMessageText) {
      return "No messages yet";
    }

    const isCurrentUserLastSender =
      userFirebaseId && conversation.lastMessageSenderId === userFirebaseId;

    const prefix = isCurrentUserLastSender ? "You: " : "";
    const messageText = conversation.lastMessageText;

    // Truncate if too long
    const maxLength = isCurrentUserLastSender ? 25 : 30;
    if (messageText.length > maxLength) {
      return `${prefix}${messageText.substring(0, maxLength)}...`;
    }

    return `${prefix}${messageText}`;
  };

  // Format price with commas for readability
  const formatPrice = (price: number): string => {
    return price.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  };

  // Get status message based on conversation status
  const getStatusMessage = (): {
    icon: JSX.Element;
    text: string;
    className: string;
  } => {
    if (isCompleted) {
      return {
        icon: <CheckCircle className="h-4 w-4 mr-2" />,
        text: "Completed Successfully",
        className: "bg-green-50 border-green-200 text-green-700",
      };
    } else if (isCancelled) {
      const isBuyerCancelled =
        conversation.status === CONVERSATION_STATUS.BUYER_CANCELLED;
      return {
        icon: <XCircle className="h-4 w-4 mr-2 text-red-600" />,
        text: `Cancelled by ${isBuyerCancelled ? "You" : "Seller"}`,
        className: "bg-red-50 border-red-300 text-red-700",
      };
    }
    return {
      icon: <></>,
      text: "",
      className: "",
    };
  };

  // Get card styling based on conversation status
  const getCardStyles = (): string => {
    if (isCancelled) {
      return "border-red-300 bg-red-50/30 shadow-md";
    } else if (isCompleted) {
      return "border-green-200 shadow-md";
    } else {
      return "hover:bg-gray-50 border-gray-200";
    }
  };

  // Component to wrap conversation
  const ConversationWrapper = ({ children }: { children: React.ReactNode }) => {
    if (disableLink || isCancelled) {
      return (
        <div className={isCancelled ? "grayscale-[30%]" : ""}>{children}</div>
      );
    }

    return (
      <Link href={`/messages/conversation/${conversation.id}`}>{children}</Link>
    );
  };

  const statusInfo = getStatusMessage();

  return (
    <ConversationWrapper>
      <Card
        className={`mb-4 overflow-hidden transition-all shadow-md hover:shadow-md font-rubik ${getCardStyles()}`}
      >
        <CardContent
          className={`p-4 relative ${isCancelled ? "bg-red-50/20" : ""}`}
        >
          {/* Role badge - only show for ongoing conversations */}
          {isOngoing && (
            <Badge
              variant={userRole === "seller" ? "outline" : "secondary"}
              className={`shadow-sm absolute top-0 left-0 rounded-tr-none rounded-bl-none z-10 ${
                userRole === "seller"
                  ? "border-blue-200 bg-blue-50 text-blue-700"
                  : "bg-green-50 text-green-700"
              }`}
            >
              {userRole === "seller" ? (
                <>
                  <LayoutDashboard className="h-3 w-3 mr-1" />
                  Ongoing Sale
                </>
              ) : (
                <>
                  <ShoppingCart className="h-3 w-3 mr-1" />
                  Ongoing Purchase
                </>
              )}
            </Badge>
          )}

          <div className={`flex relative ${isOngoing ? "pt-3" : "pt-0"}`}>
            {/* Left side: Image */}
            <div className="relative">
              <div className="flex-shrink-0">
                {item && item.images && item.images.length > 0 ? (
                  <div className="h-[125px] w-[125px] rounded-lg overflow-hidden border border-gray-200 shadow-sm">
                    <img
                      src={item.images[0] || DEFAULT_ITEM_IMAGE}
                      alt={item.title || "Item"}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : (
                  <Avatar className="h-[125px] w-[125px] border border-gray-200 shadow-sm rounded-lg">
                    <AvatarImage
                      src={otherUser?.avatarUrl || DEFAULT_AVATAR}
                      alt={otherUser?.andrewId || "User"}
                      className="object-cover"
                    />
                    <AvatarFallback className="text-2xl">
                      {otherUser?.andrewId
                        ? otherUser.andrewId[0].toUpperCase()
                        : "U"}
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            </div>

            {/* Right side: Content */}
            <div className="flex-1 min-w-0 pl-4">
              {/* Top row: Title and time */}
              <div className="flex justify-between items-start gap-2">
                <h3 className="font-semibold text-lg text-gray-900 truncate">
                  {item?.title || otherUser?.andrewId || "Unknown"}
                </h3>
                <span className="text-xs text-gray-500 whitespace-nowrap flex items-center">
                  <Clock className="inline h-3 w-3 mr-1" />
                  {formatRelativeTime(conversation.lastMessageTimestamp)}
                </span>
              </div>

              <div className="flex justify-start align-center items-start flex-col">
                {/* Type indicator for marketplace/commission */}
                {!isCancelled && isOngoing && (
                  <div className="mb-2">
                    {item && (
                      <Badge
                        className={`${
                          item.type === "commission"
                            ? "bg-purple-100 text-purple-800 border-purple-200"
                            : "bg-blue-100 text-blue-800 border-blue-200"
                        } border shadow-sm`}
                      >
                        <Tag className="h-3 w-3 mr-1" />
                        {item.type === "commission"
                          ? "Commission"
                          : "Marketplace"}
                      </Badge>
                    )}
                    {/* Price tag if available */}
                    {item && (
                      <span className="ml-2 text-sm font-medium text-green-600 bg-green-50 pt-1 px-2 rounded-full inline-flex items-center">
                        {formatPrice(item.price)}
                      </span>
                    )}
                  </div>
                )}

                {/* User info if relevant */}
                {otherUser && (
                  <div className="text-xs text-gray-600 flex items-center pb-2">
                    <User className="h-3 w-3 mr-1" />
                    <span className="font-medium">
                      {otherUser.andrewId || "Unknown User"}
                    </span>
                  </div>
                )}
              </div>

              {/* Status banner for completed/cancelled conversations */}
              {!isOngoing && statusInfo.text && (
                <div
                  className={`flex items-center text-sm p-2 rounded-md border mb-2 ${statusInfo.className}`}
                >
                  {statusInfo.icon}
                  <span className="font-medium">{statusInfo.text}</span>
                </div>
              )}

              {/* Last Message Preview */}
              {!isCancelled && isOngoing && (
                <div
                  className={`p-2 rounded-md flex items-center mt-1 text-sm text-gray-700`}
                >
                  <MessageSquare className="h-4 w-4 mr-2 text-gray-500 flex-shrink-0" />
                  <p className="truncate">{getPreviewText()}</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </ConversationWrapper>
  );
}

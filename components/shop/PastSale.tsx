/**
 * Preview component for conversations in the message list
 * Displays conversation metadata, last message, and item information
 */
"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import Link from "next/link";
import {
  Clock,
  LayoutDashboard,
  MessageSquare,
  ShoppingCart,
  User,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ConversationWithId } from "@/firebase/conversations";
import {
  CONVERSATION_STATUS,
  PREVIEW_STATUS,
} from "@/utils/ConversationConstants";
import { UserWithId } from "@/firebase/users";
import { ITEM_TYPE, ItemWithType } from "@/utils/ItemConstants";
import { formatPrice } from "@/utils/helpers";

const DEFAULT_AVATAR = "/assets/default-avatar.png";
const DEFAULT_ITEM_IMAGE = "/assets/default-item.png";

interface ConversationPreviewProps {
  conversation: ConversationWithId;
  otherUser: UserWithId | null;
  item: ItemWithType | null;
  userFirebaseId: string | null;
  disableLink?: boolean;
  state: (typeof PREVIEW_STATUS)[keyof typeof PREVIEW_STATUS];
}

export default function ConversationPreview({
  conversation,
  otherUser,
  item,
  userFirebaseId,
  disableLink = false,
  state,
}: ConversationPreviewProps) {
  // Determine conversation status
  const isCancelled = [
    CONVERSATION_STATUS.BUYER_CANCELLED,
    CONVERSATION_STATUS.SELLER_CANCELLED,
  ].includes(conversation.status);

  const isCompleted = conversation.status === CONVERSATION_STATUS.COMPLETED;
  const isOngoing = conversation.status === CONVERSATION_STATUS.ONGOING;

  // Determine the user's role in this conversation
  const isUserSeller = item ? item.sellerId === userFirebaseId : false;
  const userRole = isUserSeller ? "seller" : "buyer";

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
    if (state === PREVIEW_STATUS.ACTIVE) {
      return "border-blue-400 border-2 shadow-md";
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

    return <Link href={`/conversations/${conversation.id}`}>{children}</Link>;
  };

  const statusInfo = getStatusMessage();

  return (
    <ConversationWrapper>
      <Card
        className={`mb-4 overflow-hidden transition-all shadow-md hover:shadow-md font-rubik ${getCardStyles()}`}
      >
        <CardContent
          className={`p-4 relative ${
            state === PREVIEW_STATUS.READ
              ? "bg-gray-100 hover:bg-gray-200"
              : "bg-white hover:bg-gray-50"
          }`}
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
                  <div className="h-[50px] w-[50px] rounded-lg overflow-hidden border border-gray-200 shadow-sm">
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
              <div className="flex justify-between items-center gap-2">
                <h2 className="font-semibold text-xs text-gray-900 truncate">
                  {item?.title}
                </h2>
                <span className="text-xs text-gray-500 whitespace-nowrap flex items-center">
                  <Clock className="inline h-3 w-3 mr-1" />
                  {formatRelativeTime(conversation.lastMessageTimestamp)}
                </span>
              </div>

              <div className="flex justify-between align-center items-start gap-2 flex-row">
                {/* User info if relevant */}
                {otherUser && (
                  <div className="text-[10px] text-gray-600 flex items-center pb-2">
                    <User className="h-3 w-3 mr-1" />
                    <span className="font-medium ">{otherUser.andrewId}</span>
                  </div>
                )}

                {item && (
                  <span className="ml-2 text-xs font-medium text-green-600 ">
                    {formatPrice(item.price)}
                  </span>
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
                  className={`rounded-md flex items-center text-sm text-gray-700`}
                >
                  <MessageSquare className="h-3 w-3 mr-2 text-gray-500 flex-shrink-0" />
                  <p className="truncate text-[10px] text-gray-600">
                    {getPreviewText()}
                  </p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </ConversationWrapper>
  );
}

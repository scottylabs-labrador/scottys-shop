"use client";

import { useUser, SignIn } from "@clerk/nextjs";
import { useState, useEffect } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import {
  getConversationsByUserId,
  type ConversationWithId,
} from "@/firebase/conversations";
import {
  getUserByClerkId,
  getUserById,
  type UserWithId,
} from "@/firebase/users";
import { getMPItemById, type MPItemWithId } from "@/firebase/mpItems";
import { getCommItemById, type CommItemWithId } from "@/firebase/commItems";
import { useToast } from "@/hooks/use-toast";
import Loading from "@/components/utils/Loading";
import {
  Tag,
  MessageSquare,
  Clock,
  ShoppingCart,
  LayoutDashboardIcon,
  Inbox,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const DEFAULT_AVATAR = "/assets/default-avatar.png";
const DEFAULT_ITEM_IMAGE = "/assets/default-item.png";

// Type for combined item data with type information
type ItemWithType = (MPItemWithId | CommItemWithId) & {
  type: "marketplace" | "commission";
};

// Type for items data record
interface ItemsDataRecord {
  [key: string]: ItemWithType;
}

// Type for participant users record
interface ParticipantUsersRecord {
  [key: string]: UserWithId;
}

export default function MessagesDashboard() {
  const { isSignedIn, user } = useUser();
  const { toast } = useToast();

  // Core state with proper types
  const [conversations, setConversations] = useState<ConversationWithId[]>([]);
  const [userFirebaseId, setUserFirebaseId] = useState<string | null>(null);
  const [participantUsers, setParticipantUsers] =
    useState<ParticipantUsersRecord>({});
  const [itemsData, setItemsData] = useState<ItemsDataRecord>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("all");

  // Get user's Firestore ID from Clerk ID
  useEffect(() => {
    const fetchUserData = async () => {
      if (isSignedIn && user?.id) {
        try {
          const userData = await getUserByClerkId(user.id);
          if (userData) {
            setUserFirebaseId(userData.id);
            console.log("User Firebase ID set:", userData.id);
          } else {
            console.error("User not found for Clerk ID:", user.id);
            setError("User profile not found");
            toast({
              title: "User not found",
              description: "Your user profile couldn't be loaded",
              variant: "destructive",
            });
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          setError("Failed to load user profile");
          toast({
            title: "Error",
            description: "Failed to load your user profile",
            variant: "destructive",
          });
        } finally {
          if (!userFirebaseId) {
            setIsLoading(false);
          }
        }
      }
    };

    fetchUserData();
  }, [isSignedIn, user?.id, toast, userFirebaseId]);

  // Fetch conversations and associated items
  useEffect(() => {
    const fetchConversationsAndItems = async () => {
      if (!userFirebaseId) return;

      setIsLoading(true);
      setError(null);

      try {
        console.log("Fetching conversations for user:", userFirebaseId);

        // Get conversations
        const conversationsData =
          await getConversationsByUserId(userFirebaseId);
        console.log("Fetched conversations:", conversationsData);

        if (conversationsData && Array.isArray(conversationsData)) {
          // Get all unique participant IDs except current user
          const participantIds = new Set<string>();
          conversationsData.forEach((conv) => {
            if (conv?.participants && Array.isArray(conv.participants)) {
              conv.participants.forEach((id) => {
                if (id && id !== userFirebaseId) {
                  participantIds.add(id);
                }
              });
            }
          });

          console.log("Unique participant IDs:", Array.from(participantIds));

          // Fetch all participant users' data
          const users: ParticipantUsersRecord = {};
          await Promise.all(
            Array.from(participantIds).map(async (id) => {
              try {
                const userData = await getUserById(id);
                if (userData) {
                  users[id] = userData;
                }
              } catch (error) {
                console.error(`Error fetching participant ${id}:`, error);
              }
            })
          );

          setParticipantUsers(users);

          // Fetch item data for each conversation with an itemId
          const items: ItemsDataRecord = {};
          await Promise.all(
            conversationsData
              .filter((conv) => conv.itemId)
              .map(async (conv) => {
                try {
                  if (!conv.itemId) return;

                  // Determine item type
                  const itemType = conv.itemType || "marketplace"; // Default to marketplace if not specified

                  // Fetch the appropriate item
                  if (itemType === "commission") {
                    const itemData = await getCommItemById(conv.itemId);
                    if (itemData) {
                      items[conv.itemId] = {
                        ...itemData,
                        type: "commission" as const,
                      };
                    }
                  } else {
                    const itemData = await getMPItemById(conv.itemId);
                    if (itemData) {
                      items[conv.itemId] = {
                        ...itemData,
                        type: "marketplace" as const,
                      };
                    }
                  }
                } catch (error) {
                  console.error(`Error fetching item ${conv.itemId}:`, error);
                }
              })
          );

          setItemsData(items);
          setConversations(conversationsData);
        } else {
          console.error(
            "Invalid conversations data format:",
            conversationsData
          );
          setError("Invalid data format");
        }
      } catch (error) {
        console.error("Error fetching conversations:", error);
        setError("Failed to load conversations");
        toast({
          title: "Error",
          description: "Failed to load conversations",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (userFirebaseId) {
      fetchConversationsAndItems();
    }
  }, [userFirebaseId, toast]);

  // Helper to get other participant in a conversation
  const getOtherParticipant = (
    conversation: ConversationWithId
  ): UserWithId | null => {
    if (!userFirebaseId || !conversation.participants) return null;

    const otherParticipantId = conversation.participants.find(
      (id) => id !== userFirebaseId
    );

    if (!otherParticipantId) return null;

    return participantUsers[otherParticipantId] || null;
  };

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
  const getPreviewText = (conversation: ConversationWithId): string => {
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

  // Determine if the user is the seller for a conversation
  const isUserSeller = (conversation: ConversationWithId): boolean => {
    if (!conversation.itemId || !userFirebaseId) return false;

    const item = itemsData[conversation.itemId];
    if (!item) return false;

    return item.sellerId === userFirebaseId;
  };

  // Filter conversations by buyer/seller role
  const sellerConversations = conversations.filter(
    (conv) => conv.itemId && isUserSeller(conv)
  );
  const buyerConversations = conversations.filter(
    (conv) => conv.itemId && !isUserSeller(conv)
  );

  // Include any conversations without itemId in the "All" category only

  // Get the number of each type for badges
  const sellerCount = sellerConversations.length;
  const buyerCount = buyerConversations.length;
  const totalCount = conversations.length;

  // Render a conversation item (extracted as a function for reuse)
  const renderConversationItem = (conversation: ConversationWithId) => {
    const otherUser = getOtherParticipant(conversation);
    const item = conversation.itemId ? itemsData[conversation.itemId] : null;

    return (
      <Link
        key={conversation.id}
        href={`/messages/conversation/${conversation.id}`}
      >
        <div className="flex items-start gap-3 p-4 rounded-lg border hover:bg-gray-50 transition-colors">
          {/* Image - Show item image if available, otherwise user avatar */}
          {item && item.images && item.images.length > 0 ? (
            <div className="h-16 w-16 rounded-md overflow-hidden border-2 border-gray-200">
              <img
                src={item.images[0] || DEFAULT_ITEM_IMAGE}
                alt={item.title || "Item"}
                className="h-full w-full object-cover"
              />
            </div>
          ) : (
            <Avatar className="h-12 w-12 border-2 border-gray-200">
              <AvatarImage
                src={otherUser?.avatarUrl || DEFAULT_AVATAR}
                alt={otherUser?.name || "User"}
                className="object-cover"
              />
              <AvatarFallback>
                {otherUser?.name ? otherUser.name[0] : "U"}
              </AvatarFallback>
            </Avatar>
          )}

          <div className="flex-1 min-w-0">
            {/* Primary title - Item title or username */}
            <div className="flex justify-between items-baseline">
              <p className="font-medium truncate">
                {item?.title || otherUser?.name || "User"}
              </p>
              <span className="text-xs text-gray-500 ml-2 whitespace-nowrap flex items-center">
                <Clock className="inline mr-1 h-3 w-3" />
                {formatRelativeTime(conversation.lastMessageTimestamp)}
              </span>
            </div>

            {/* Item info or message preview */}
            {item ? (
              <div className="flex items-center gap-2 text-xs text-blue-600 mt-1">
                <Tag className="h-3 w-3" />
                <span>
                  {item.type === "commission" ? "Commission" : "Marketplace"}: $
                  {item.price}
                </span>
              </div>
            ) : null}

            {/* Message preview */}
            <div className="flex items-center gap-1 mt-1">
              <MessageSquare className="h-3 w-3 text-gray-500" />
              <p className="text-sm text-gray-600 truncate">
                {getPreviewText(conversation)}
              </p>
            </div>

            {/* User info if showing an item */}
            {item && otherUser && (
              <p className="text-xs text-gray-500 mt-1">
                {otherUser.name || "Unknown User"}
              </p>
            )}
          </div>
        </div>
      </Link>
    );
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 text-center">
        <Loading />
      </div>
    );
  }

  // Show Sign In if user is not authenticated
  if (!user) {
    return (
      <div className="flex justify-center items-center h-[80vh]">
        <SignIn />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-6 font-rubik max-w-3xl">
        <h1 className="text-2xl font-semibold mb-6">Messages</h1>
        <div className="text-center py-10 bg-gray-50 rounded-lg border">
          <p className="text-red-500">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 font-rubik max-w-6xl">
      <h1 className="text-2xl font-semibold mb-6">Messages</h1>

      {conversations.length === 0 ? (
        <div className="text-center py-10 bg-gray-50 rounded-lg border">
          <p className="text-gray-500">You don't have any conversations yet.</p>
          <p className="text-gray-500 mt-2">
            Visit the marketplace to browse items and message sellers.
          </p>
        </div>
      ) : (
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="mb-6 grid grid-cols-3 w-full">
            <TabsTrigger value="all" className="text-center">
              <div className="flex items-center">
                <Inbox className="w-4 h-4 mr-2" />
                All
                <span className="ml-2 bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full text-xs">
                  {totalCount}
                </span>
              </div>
            </TabsTrigger>
            <TabsTrigger value="selling" className="text-center">
              <div className="flex items-center">
                <LayoutDashboardIcon className="w-4 h-4 mr-2" />
                Your Items
                <span className="ml-2 bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs">
                  {sellerCount}
                </span>
              </div>
            </TabsTrigger>
            <TabsTrigger value="buying" className="text-center">
              <div className="flex items-center">
                <ShoppingCart className="w-4 h-4 mr-2" />
                Your Inquiries
                <span className="ml-2 bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs">
                  {buyerCount}
                </span>
              </div>
            </TabsTrigger>
          </TabsList>

          {/* All conversations tab */}
          <TabsContent value="all">
            {conversations.length > 0 ? (
              <div className="space-y-3">
                {conversations
                  .filter(
                    (conv) =>
                      conv && conv.participants && conv.participants.length > 0
                  )
                  .sort(
                    (a, b) =>
                      (b.lastMessageTimestamp || 0) -
                      (a.lastMessageTimestamp || 0)
                  )
                  .map((conversation) => renderConversationItem(conversation))}
              </div>
            ) : (
              <div className="text-center py-10 bg-gray-50 rounded-lg border">
                <p className="text-gray-500">No conversations to display.</p>
              </div>
            )}
          </TabsContent>

          {/* Your items (selling) tab */}
          <TabsContent value="selling">
            {sellerConversations.length > 0 ? (
              <div className="space-y-3">
                <div className="mb-4">
                  <h2 className="text-lg font-medium text-gray-800 mb-1">
                    Messages about items you're selling
                  </h2>
                  <p className="text-sm text-gray-500">
                    Conversations with buyers interested in your products
                  </p>
                </div>
                {sellerConversations
                  .sort(
                    (a, b) =>
                      (b.lastMessageTimestamp || 0) -
                      (a.lastMessageTimestamp || 0)
                  )
                  .map((conversation) => renderConversationItem(conversation))}
              </div>
            ) : (
              <div className="text-center py-10 bg-gray-50 rounded-lg border">
                <p className="text-gray-500">
                  No messages about items you're selling.
                </p>
                <p className="text-gray-500 mt-2">
                  When buyers contact you about your items, they'll appear here.
                </p>
              </div>
            )}
          </TabsContent>

          {/* Your inquiries (buying) tab */}
          <TabsContent value="buying">
            {buyerConversations.length > 0 ? (
              <div className="space-y-3">
                <div className="mb-4">
                  <h2 className="text-lg font-medium text-gray-800 mb-1">
                    Your inquiries about items
                  </h2>
                  <p className="text-sm text-gray-500">
                    Conversations with sellers about items you're interested in
                  </p>
                </div>
                {buyerConversations
                  .sort(
                    (a, b) =>
                      (b.lastMessageTimestamp || 0) -
                      (a.lastMessageTimestamp || 0)
                  )
                  .map((conversation) => renderConversationItem(conversation))}
              </div>
            ) : (
              <div className="text-center py-10 bg-gray-50 rounded-lg border">
                <p className="text-gray-500">No inquiries about items.</p>
                <p className="text-gray-500 mt-2">
                  When you message sellers about their items, they'll appear
                  here.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

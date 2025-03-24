"use client";

import { useUser, SignIn } from "@clerk/nextjs";
import { useState, useEffect } from "react";
import {
  getConversationsByUserId,
  type ConversationWithId,
} from "@/firebase/conversations";
import { CONVERSATION_STATUS } from "@/utils/ConversationConstants";
import {
  getUserByClerkId,
  getUserById,
  type UserWithId,
} from "@/firebase/users";
import { getMPItemById } from "@/firebase/mpItems";
import { getCommItemById } from "@/firebase/commItems";
import { ITEM_TYPE } from "@/utils/ItemConstants";
import { useToast } from "@/hooks/use-toast";
import Loading from "@/components/utils/Loading";
import { Inbox, Info, LayoutDashboard, ShoppingCart } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import ConversationPreview from "@/components/conversations/ConversationPreview";

/**
 * Type for combined item data with type information
 * This represents either a marketplace or commission item with a standardized type field
 */
type ItemWithType = {
  id: string;
  sellerId: string;
  title: string;
  description?: string;
  price: number;
  images: string[];
  type: typeof ITEM_TYPE.COMMISSION | typeof ITEM_TYPE.MARKETPLACE;
};

/**
 * A lookup object that maps item IDs to their data
 * Allows for fast O(1) access to items by their ID without searching arrays
 */
interface ItemsDataRecord {
  [key: string]: ItemWithType;
}

/**
 * A lookup object that maps user IDs to their data
 * Allows for quick rendering of conversations
 */
interface UsersDataRecord {
  [key: string]: UserWithId;
}

export default function MessagesDashboard() {
  const { isSignedIn, user } = useUser();
  const { toast } = useToast();

  // Core state
  const [conversations, setConversations] = useState<ConversationWithId[]>([]);
  const [userFirebaseId, setUserFirebaseId] = useState<string | null>(null);
  const [usersData, setUsersData] = useState<UsersDataRecord>({});
  const [itemsData, setItemsData] = useState<ItemsDataRecord>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("all");

  // Step 1: Get the current user's Firebase ID from their Clerk ID
  useEffect(() => {
    async function fetchUserFirebaseId() {
      if (!isSignedIn || !user?.id) return;

      try {
        const userData = await getUserByClerkId(user.id);
        if (userData) {
          setUserFirebaseId(userData.id);
        } else {
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

    fetchUserFirebaseId();
  }, [isSignedIn, user?.id, toast, userFirebaseId]);

  // Step 2: Load conversations and associated data (users and items)
  useEffect(() => {
    if (!userFirebaseId) return;

    async function loadConversationsData() {
      setIsLoading(true);
      setError(null);

      try {
        // 1. Get all conversations for the current user
        const userConversations =
          await getConversationsByUserId(userFirebaseId);

        if (!Array.isArray(userConversations)) {
          throw new Error("Invalid conversations data format");
        }

        // 2. Extract all unique user IDs and item IDs for batch loading
        const otherUserIds = new Set<string>();
        const itemIdsToLoad = new Map<string, string>(); // Map of itemId -> itemType

        userConversations.forEach((conv) => {
          // Collect other participant IDs
          conv.participants?.forEach((participantId) => {
            if (participantId && participantId !== userFirebaseId) {
              otherUserIds.add(participantId);
            }
          });

          // Collect item IDs with their types
          if (conv.itemId) {
            itemIdsToLoad.set(conv.itemId, conv.itemType || "marketplace");
          }
        });

        // 3. Load all users in parallel
        const usersResult: UsersDataRecord = {};
        await Promise.all(
          Array.from(otherUserIds).map(async (userId) => {
            try {
              const userData = await getUserById(userId);
              if (userData) {
                usersResult[userId] = userData;
              }
            } catch (error) {
              console.error(`Error loading user ${userId}:`, error);
            }
          })
        );

        // 4. Load all items in parallel
        const itemsResult: ItemsDataRecord = {};
        await Promise.all(
          Array.from(itemIdsToLoad.entries()).map(
            async ([itemId, itemType]) => {
              try {
                if (itemType === "commission") {
                  const itemData = await getCommItemById(itemId);
                  if (itemData) {
                    itemsResult[itemId] = {
                      ...itemData,
                      type: ITEM_TYPE.COMMISSION,
                    };
                  }
                } else {
                  const itemData = await getMPItemById(itemId);
                  if (itemData) {
                    itemsResult[itemId] = {
                      ...itemData,
                      type: ITEM_TYPE.MARKETPLACE,
                    };
                  }
                }
              } catch (error) {
                console.error(`Error loading item ${itemId}:`, error);
              }
            }
          )
        );

        // 5. Update state with all loaded data
        setConversations(userConversations);
        setUsersData(usersResult);
        setItemsData(itemsResult);
      } catch (error) {
        console.error("Error loading conversations data:", error);
        setError("Failed to load conversations");
        toast({
          title: "Error",
          description: "Failed to load conversations",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }

    loadConversationsData();
  }, [userFirebaseId, toast]);

  /**
   * Get the other participant in a conversation
   * @param conversation The conversation to find the other participant for
   * @returns The other user in the conversation, or null if not found
   */
  function getOtherParticipant(
    conversation: ConversationWithId
  ): UserWithId | null {
    if (!userFirebaseId || !conversation.participants) return null;

    const otherUserId = conversation.participants.find(
      (id) => id !== userFirebaseId
    );
    return otherUserId ? usersData[otherUserId] || null : null;
  }

  /**
   * Check if the current user is the seller in this conversation
   * @param conversation The conversation to check
   * @returns True if the user is the seller, false otherwise
   */
  function isUserSeller(conversation: ConversationWithId): boolean {
    if (!userFirebaseId || !conversation.itemId) return false;

    const item = itemsData[conversation.itemId];
    return item ? item.sellerId === userFirebaseId : false;
  }

  /**
   * Check if a conversation was cancelled within the last 24 hours
   * @param conversation The conversation to check
   * @returns True if the conversation was recently cancelled
   */
  function isRecentlyCancelled(conversation: ConversationWithId): boolean {
    const cancelledStatuses = [
      CONVERSATION_STATUS.BUYER_CANCELLED,
      CONVERSATION_STATUS.SELLER_CANCELLED,
    ];

    if (!cancelledStatuses.includes(conversation.status)) return false;

    // Check if cancellation was within last 24 hours
    const hoursSinceCancellation =
      (Date.now() - (conversation.lastMessageTimestamp || 0)) /
      (1000 * 60 * 60);

    return hoursSinceCancellation <= 24;
  }

  // Filter conversations for display
  const visibleConversations = conversations.filter(
    (conv) =>
      conv.status === CONVERSATION_STATUS.ONGOING || isRecentlyCancelled(conv)
  );

  const sellerConversations = visibleConversations.filter(
    (conv) => conv.itemId && isUserSeller(conv)
  );

  const buyerConversations = visibleConversations.filter(
    (conv) => conv.itemId && !isUserSeller(conv)
  );

  // Check if there are any cancelled conversations
  const hasCancelledConversations = visibleConversations.some(
    (conv) =>
      conv.status === CONVERSATION_STATUS.BUYER_CANCELLED ||
      conv.status === CONVERSATION_STATUS.SELLER_CANCELLED
  );

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 text-center">
        <Loading />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex justify-center items-center h-[80vh]">
        <SignIn />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-3xl">
        <h1 className="text-2xl font-semibold mb-6">Messages</h1>
        <Card className="p-8 text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Try Again
          </button>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl font-rubik">
      <h1 className="text-5xl font-caladea mb-6 border-b-4 border-[#C41230] pb-2">
        Messages
      </h1>

      {visibleConversations.length === 0 ? (
        <div className="text-center py-10 bg-gray-50 rounded-lg border">
          <p className="text-gray-500">You don't have any conversations yet.</p>
          <p className="text-gray-500 mt-2">
            Visit the marketplace to browse items and message sellers.
          </p>
        </div>
      ) : (
        <Tabs
          defaultValue="all"
          className="w-full"
          onValueChange={setActiveTab}
        >
          <TabsList className="mb-6 grid grid-cols-3 w-full">
            <TabsTrigger value="all" className="text-center">
              <div className="flex items-center">
                <Inbox className="w-4 h-4 mr-2" />
                All
              </div>
            </TabsTrigger>
            <TabsTrigger value="selling" className="text-center">
              <div className="flex items-center">
                <LayoutDashboard className="w-4 h-4 mr-2" />
                Ongoing Sales
              </div>
            </TabsTrigger>
            <TabsTrigger value="buying" className="text-center">
              <div className="flex items-center">
                <ShoppingCart className="w-4 h-4 mr-2" />
                Ongoing Purchases
              </div>
            </TabsTrigger>
          </TabsList>

          {/* Info banner about cancelled conversations */}
          {hasCancelledConversations && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md flex items-start gap-2">
              <Info className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-blue-700">
                Cancelled conversations remain visible for 24 hours before being
                removed. They are indicated with a status badge and cannot be
                accessed.
              </p>
            </div>
          )}

          {/* All conversations tab */}
          <TabsContent value="all">
            {visibleConversations.length > 0 ? (
              <div>
                {visibleConversations
                  .filter((conv) => conv?.participants?.length > 0)
                  .sort(
                    (a, b) =>
                      (b.lastMessageTimestamp || 0) -
                      (a.lastMessageTimestamp || 0)
                  )
                  .map((conversation) => (
                    <ConversationPreview
                      key={conversation.id}
                      conversation={conversation}
                      otherUser={getOtherParticipant(conversation)}
                      item={
                        conversation.itemId
                          ? itemsData[conversation.itemId]
                          : null
                      }
                      userFirebaseId={userFirebaseId}
                      activeTab={activeTab}
                    />
                  ))}
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
              <div>
                <div className="mb-4">
                  <h2 className="text-lg font-medium text-gray-800 mb-1">
                    Messages About Your Ongoing Sales
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
                  .map((conversation) => (
                    <ConversationPreview
                      key={conversation.id}
                      conversation={conversation}
                      otherUser={getOtherParticipant(conversation)}
                      item={
                        conversation.itemId
                          ? itemsData[conversation.itemId]
                          : null
                      }
                      userFirebaseId={userFirebaseId}
                      activeTab={activeTab}
                    />
                  ))}
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

          {/* Your Ongoing Purchases (buying) tab */}
          <TabsContent value="buying">
            {buyerConversations.length > 0 ? (
              <div>
                <div className="mb-4">
                  <h2 className="text-lg font-medium text-gray-800 mb-1">
                    Messages About your Ongoing Purchases
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
                  .map((conversation) => (
                    <ConversationPreview
                      key={conversation.id}
                      conversation={conversation}
                      otherUser={getOtherParticipant(conversation)}
                      item={
                        conversation.itemId
                          ? itemsData[conversation.itemId]
                          : null
                      }
                      userFirebaseId={userFirebaseId}
                      activeTab={activeTab}
                    />
                  ))}
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

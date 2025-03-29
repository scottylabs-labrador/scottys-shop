"use client";

import { useUser, SignIn } from "@clerk/nextjs";
import { useState, useEffect } from "react";
import Link from "next/link";
import {
  getConversationsByUserId,
  type ConversationWithId,
} from "@/firebase/conversations";
import {
  CONVERSATION_STATUS,
  statusColors,
  statusDisplayNames,
} from "@/utils/ConversationConstants";
import {
  getUserByClerkId,
  getUserById,
  type UserWithId,
} from "@/firebase/users";
import { getMPItemById, type MPItemWithId } from "@/firebase/mpItems";
import { getCommItemById, type CommItemWithId } from "@/firebase/commItems";
import { useToast } from "@/hooks/use-toast";
import Loading from "@/components/utils/Loading";
import { Inbox, Info, LayoutDashboard, ShoppingCart } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import ConversationPreview from "@/components/conversations/ConversationPreview";

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

export default function OngoingTransactions() {
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
        // Get conversations
        const conversationsData =
          await getConversationsByUserId(userFirebaseId);

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

  // Determine if the user is the seller for a conversation
  const isUserSeller = (conversation: ConversationWithId): boolean => {
    if (!conversation.itemId || !userFirebaseId) return false;

    const item = itemsData[conversation.itemId];
    if (!item) return false;

    return item.sellerId === userFirebaseId;
  };

  

  // Filter conversations by status
  const visibleConversations = conversations.filter(
    (conv) =>
      conv.status === CONVERSATION_STATUS.ONGOING
  );

  const sellerConversations = visibleConversations.filter(
    (conv) => conv.itemId && isUserSeller(conv)
  );

  const buyerConversations = visibleConversations.filter(
    (conv) => conv.itemId && !isUserSeller(conv)
  );

  // Get conversation counts for badges
  const sellerCount = sellerConversations.length;
  const buyerCount = buyerConversations.length;
  const totalCount = visibleConversations.length;

  

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
        Ongoing Transactions
      </h1>

      {visibleConversations.length === 0 ? (
        <div className="text-center py-10 bg-gray-50 rounded-lg border">
          <p className="text-gray-500">You don't have any ongoing transactions right now.</p>
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

          {/* All conversations tab */}
          <TabsContent value="all">
            {visibleConversations.length > 0 ? (
              <div>
                {visibleConversations
                  .filter(
                    (conv) =>
                      conv && conv.participants && conv.participants.length > 0
                  )
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
                <p className="text-gray-500">No transactions to display.</p>
              </div>
            )}
          </TabsContent>

          {/* Your items (selling) tab */}
          <TabsContent value="selling">
            {sellerConversations.length > 0 ? (
              <div>
                <div className="mb-4">
                  <h2 className="text-lg font-medium text-gray-800 mb-1">
                    Your Ongoing Sales
                  </h2>
                  <p className="text-sm text-gray-500">
                    Transactions with buyers interested in your products
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
                  No ongoing transactions about items you're selling.
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
                    Your Ongoing Purchases
                  </h2>
                  <p className="text-sm text-gray-500">
                    Ongoing transactions with sellers about items you're interested in
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
                <p className="text-gray-500">No ongoing transactions about items.</p>
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

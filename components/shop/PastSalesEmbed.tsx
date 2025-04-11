/**
 * Component for displaying past sales history
 * Shows completed transactions and sales statistics
 */
"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import {
  getConversationsByUserId,
  type ConversationWithId,
} from "@/firebase/conversations";
import {
  getUserByClerkId,
  getUserById,
  type UserWithId,
} from "@/firebase/users";
import { getMPItemById } from "@/firebase/mpItems";
import { getCommItemById } from "@/firebase/commItems";
import {
  CONVERSATION_STATUS,
  PREVIEW_STATUS,
  UsersDataRecord,
  ItemsDataRecord,
} from "@/utils/ConversationConstants";
import { useToast } from "@/hooks/use-toast";
import Loading from "@/components/utils/Loading";
import ConversationPreview from "@/components/conversations/ConversationPreview";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Calendar, AlertTriangle } from "lucide-react";
import { formatPrice } from "@/utils/helpers";
import { ITEM_TYPE } from "@/utils/ItemConstants";

// Helper function to get other participant in a conversation
const getOtherParticipant = (
  conversation: ConversationWithId,
  userFirebaseId: string | null,
  participantUsers: UsersDataRecord
): UserWithId | null => {
  if (!userFirebaseId || !conversation.participants) return null;

  const otherParticipantId = conversation.participants.find(
    (id) => id !== userFirebaseId
  );

  if (!otherParticipantId) return null;

  return participantUsers[otherParticipantId] || null;
};

export default function PastSalesEmbed() {
  const { isSignedIn, user } = useUser();
  const { toast } = useToast();

  // State
  const [completedSales, setCompletedSales] = useState<ConversationWithId[]>(
    []
  );
  const [userFirebaseId, setUserFirebaseId] = useState<string | null>(null);
  const [participantUsers, setParticipantUsers] = useState<UsersDataRecord>({});
  const [itemsData, setItemsData] = useState<ItemsDataRecord>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalSalesAmount, setTotalSalesAmount] = useState<number>(0);

  // Get user's Firestore ID from Clerk ID
  useEffect(() => {
    const fetchUserData = async () => {
      if (isSignedIn && user?.id) {
        try {
          const userData = await getUserByClerkId(user.id);
          if (userData) {
            setUserFirebaseId(userData.id);
          } else {
            setError("User profile not found");
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          setError("Failed to load user profile");
        } finally {
          if (!userFirebaseId) {
            setIsLoading(false);
          }
        }
      }
    };

    fetchUserData();
  }, [isSignedIn, user?.id]);

  // Fetch completed sales conversations
  useEffect(() => {
    const fetchCompletedSales = async () => {
      if (!userFirebaseId) return;

      setIsLoading(true);
      setError(null);

      try {
        // Get all conversations for user
        const conversationsData =
          await getConversationsByUserId(userFirebaseId);

        if (conversationsData && Array.isArray(conversationsData)) {
          // Filter to only completed conversations where user is seller
          const completed = conversationsData.filter((conv) => {
            if (conv.status !== CONVERSATION_STATUS.COMPLETED) return false;

            // We need to check if there's an item associated
            if (!conv.itemId) return false;

            // We'll determine if user is seller after fetching items
            return true;
          });

          if (completed.length > 0) {
            // Get all unique participant IDs except current user
            const participantIds = new Set<string>();
            completed.forEach((conv) => {
              if (conv?.participants && Array.isArray(conv.participants)) {
                conv.participants.forEach((id) => {
                  if (id && id !== userFirebaseId) {
                    participantIds.add(id);
                  }
                });
              }
            });

            // Fetch all participant users' data
            const users: UsersDataRecord = {};
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
              completed
                .filter((conv) => conv.itemId)
                .map(async (conv) => {
                  try {
                    if (!conv.itemId) return;

                    // Determine item type
                    const itemType = conv.itemType || ITEM_TYPE.MARKETPLACE; // Default to marketplace if not specified

                    // Fetch the appropriate item
                    if (itemType === ITEM_TYPE.COMMISSION) {
                      const itemData = await getCommItemById(conv.itemId);
                      if (itemData) {
                        items[conv.itemId] = {
                          ...itemData,
                          type: ITEM_TYPE.COMMISSION,
                        };
                      }
                    } else {
                      const itemData = await getMPItemById(conv.itemId);
                      if (itemData) {
                        items[conv.itemId] = {
                          ...itemData,
                          type: ITEM_TYPE.MARKETPLACE,
                        };
                      }
                    }
                  } catch (error) {
                    console.error(`Error fetching item ${conv.itemId}:`, error);
                  }
                })
            );

            setItemsData(items);

            // Now that we have the items, filter for only those where the user is the seller
            const completedSales = completed.filter((conv) => {
              if (!conv.itemId) return false;
              const item = items[conv.itemId];
              return item && item.sellerId === userFirebaseId;
            });

            setCompletedSales(completedSales);

            // Calculate total sales amount
            let total = 0;
            completedSales.forEach((conv) => {
              if (conv.itemId && items[conv.itemId]) {
                total += items[conv.itemId].price;
              }
            });
            setTotalSalesAmount(total);
          } else {
            setCompletedSales([]);
          }
        } else {
          console.error(
            "Invalid conversations data format:",
            conversationsData
          );
          setError("Invalid data format");
        }
      } catch (error) {
        console.error("Error fetching completed sales:", error);
        setError("Failed to load completed sales");
      } finally {
        setIsLoading(false);
      }
    };

    if (userFirebaseId) {
      fetchCompletedSales();
    }
  }, [userFirebaseId]);

  // Group sales by month for the summary
  const groupSalesByMonth = () => {
    const salesByMonth: { [key: string]: { count: number; amount: number } } =
      {};

    completedSales.forEach((conv) => {
      if (conv.itemId && itemsData[conv.itemId]) {
        const date = new Date(conv.lastMessageTimestamp);
        const monthYear = `${date.getMonth() + 1}/${date.getFullYear()}`;

        if (!salesByMonth[monthYear]) {
          salesByMonth[monthYear] = { count: 0, amount: 0 };
        }

        salesByMonth[monthYear].count += 1;
        salesByMonth[monthYear].amount += itemsData[conv.itemId].price;
      }
    });

    return salesByMonth;
  };

  // Render component
  if (isLoading) {
    return <Loading />;
  }

  // Show empty state if no completed sales
  if (!completedSales.length) {
    return (
      <Card className="w-full border shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl font-medium flex items-center">
            Past Sales
          </CardTitle>
        </CardHeader>
        <CardContent className="py-6 text-center">
          <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
            <AlertTriangle className="h-10 w-10 text-gray-400 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-800 mb-2">
              No Completed Sales Yet
            </h3>
            <p className="text-gray-500 text-sm max-w-md mx-auto">
              When you complete sales with buyers, they'll appear here as a
              record of your transaction history.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Sales summary data
  const salesByMonth = groupSalesByMonth();

  return (
    <div className="font-rubik">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm mb-4">
          {error}
        </div>
      )}

      {/* Sales Summary */}
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 mb-6">
        <h3 className="font-medium text-gray-800 mb-3 flex items-center">
          Sales Summary
        </h3>

        <div className="grid md:grid-cols-2 gap-4 mb-3">
          <div className="bg-white rounded-md p-3 border border-gray-200 shadow-sm">
            <div className="text-sm text-gray-600 mb-1">
              Total Sales Revenue
            </div>
            <div className="font-bold text-xl text-green-600">
              {formatPrice(totalSalesAmount)}
            </div>
          </div>

          <div className="bg-white rounded-md p-3 border border-gray-200 shadow-sm">
            <div className="text-sm text-gray-600 mb-1">Total Items Sold</div>
            <div className="font-bold text-xl">{completedSales.length}</div>
          </div>
        </div>

        {/* Monthly breakdown */}
        {Object.keys(salesByMonth).length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
              <Calendar className="h-3 w-3 mr-1" />
              Monthly Breakdown
            </h4>
            <div className="space-y-2 text-sm">
              {Object.entries(salesByMonth)
                .sort((a, b) => b[0].localeCompare(a[0])) // Sort by most recent first
                .map(([month, data]) => (
                  <div
                    key={month}
                    className="flex justify-between items-center bg-white px-3 py-2 rounded border"
                  >
                    <div className="font-medium">{month}</div>
                    <div className="flex gap-4">
                      <span>
                        {data.count} item{data.count !== 1 ? "s" : ""}
                      </span>
                      <span className="text-green-600 font-medium">
                        {formatPrice(data.amount)}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* Sales List */}
      <h3 className="font-medium text-gray-800 mb-3 ml-5">Sales History</h3>
      <div className="space-y-3">
        {completedSales
          .sort(
            (a, b) =>
              (b.lastMessageTimestamp || 0) - (a.lastMessageTimestamp || 0)
          )
          .map((conversation) => (
            <ConversationPreview
              key={conversation.id}
              conversation={conversation}
              otherUser={getOtherParticipant(
                conversation,
                userFirebaseId,
                participantUsers
              )}
              item={conversation.itemId ? itemsData[conversation.itemId] : null}
              userFirebaseId={userFirebaseId}
              state={PREVIEW_STATUS.UNREAD}
            />
          ))}
      </div>
    </div>
  );
}

"use client";
import { useEffect, useState } from "react";
import { useUser, SignIn } from "@clerk/nextjs";
import { useParams, useRouter } from "next/navigation";
import { getUserByClerkId } from "@/firebase/users";
import { getCommItemById } from "@/firebase/commItems";
import { getUserById } from "@/firebase/users";
import { getMPItemById } from "@/firebase/mpItems";
import {
  getConversationsByUserId,
  ConversationWithId,
  getMessagesForConversation,
} from "@/firebase/conversations";
import { useToast } from "@/hooks/use-toast";
import { ITEM_TYPE } from "@/utils/ItemConstants";
import Loading from "@/components/utils/Loading";
import ErrorState from "@/components/conversations/chat/ErrorState";
import Chat from "@/components/conversations/Chat";

import {
  CONVERSATION_STATUS,
  ItemsDataRecord,
  UsersDataRecord,
} from "@/utils/ConversationConstants";
import ConversationList from "@/components/conversations/ConversationList";

export default function ConversationPage() {
  const router = useRouter();

  const { user, isSignedIn, isLoaded } = useUser();
  const { toast } = useToast();

  // Core state
  const [conversations, setConversations] = useState<ConversationWithId[]>([]);
  const [unreadConversations, setUnreadConversations] = useState<
    ConversationWithId[]
  >([]);
  const [readConversations, setReadConversations] = useState<
    ConversationWithId[]
  >([]);
  const [usersData, setUsersData] = useState<UsersDataRecord>({});
  const [itemsData, setItemsData] = useState<ItemsDataRecord>({});
  const [isLoading, setIsLoading] = useState(true);

  // State
  const [userFirebaseId, setUserFirebaseId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Get user Firebase ID from Clerk ID
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
        }
      }
    };
    fetchUserData();
  }, [isSignedIn, user?.id]);

  // Retrieve all conversations for the current user
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
            itemIdsToLoad.set(
              conv.itemId,
              conv.itemType === ITEM_TYPE.COMMISSION
                ? ITEM_TYPE.COMMISSION
                : ITEM_TYPE.MARKETPLACE
            );
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
      }
    }

    loadConversationsData();
  }, [userFirebaseId, toast]);

  // Check if a conversation is unread
  async function isUnread(conversation: ConversationWithId): Promise<boolean> {
    if (!conversation.id) return false;

    const messages = await getMessagesForConversation(conversation.id);
    if (!messages) return false;

    const lastMessage = messages[messages.length - 1];

    return (
      lastMessage.senderId !== userFirebaseId &&
      !lastMessage.isRead &&
      conversation.status === CONVERSATION_STATUS.ONGOING
    );
  }

  // Set Unread and Read Conversations
  useEffect(() => {
    async function checkUnreadConversations() {
      const unread = await Promise.all(
        conversations.map(async (conv) => {
          const isUnreadConv = await isUnread(conv);
          return { conv, isUnreadConv };
        })
      );

      setUnreadConversations(
        unread
          .filter(
            ({ conv, isUnreadConv }) =>
              isUnreadConv && conv.status === CONVERSATION_STATUS.ONGOING
          )
          .map(({ conv }) => conv)
      );

      setReadConversations(
        unread
          .filter(
            ({ conv, isUnreadConv }) =>
              !isUnreadConv && conv.status === CONVERSATION_STATUS.ONGOING
          )
          .map(({ conv }) => conv)
      );
    }

    if (conversations.length > 0) {
      checkUnreadConversations();
      setIsLoading(false);
    }
  }, [conversations, userFirebaseId]);

  const navigateBack = () => {
    router.push("/conversations");
  };

  if (!isLoaded) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loading />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex justify-center items-center h-screen">
        <SignIn />
      </div>
    );
  }

  if (error) {
    return <ErrorState error={error} onBackClick={navigateBack} />;
  }

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden">
      <div className="mx-auto w-full max-w-8xl px-4 py-[135px] max-h-xl overflow-hidden flex flex-row flex-grow">
        <div className="w-[35%] h-full">
          <ConversationList
            userFirebaseId={userFirebaseId}
            usersData={usersData}
            itemsData={itemsData}
            unreadConversations={unreadConversations}
            readConversations={readConversations}
            activeConversationId={null}
          />
        </div>
        <div className="w-[65%]"></div>
      </div>
    </div>
  );
}

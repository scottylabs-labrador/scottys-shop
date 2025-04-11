/**
 * Message notifications context
 * Provides site-wide real-time updates for messages and unread counts
 */
"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { db } from "@/firebase/firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
} from "firebase/firestore";
import { getUserByClerkId } from "@/firebase/users";
import type { ConversationWithId } from "@/firebase/conversations";

// Type for the context value
type NotificationContextType = {
  unreadCount: number;
  conversations: ConversationWithId[];
  loading: boolean;
};

// Create context with default values
const NotificationContext = createContext<NotificationContextType>({
  unreadCount: 0,
  conversations: [],
  loading: true,
});

/**
 * Provider component that wraps your app and makes message notification data
 * available to any child component that calls useMessageNotifications().
 */
export function MessageNotificationsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isSignedIn, user } = useUser();
  const [userFirebaseId, setUserFirebaseId] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [conversations, setConversations] = useState<ConversationWithId[]>([]);
  const [loading, setLoading] = useState(true);

  // Step 1: Get user's Firebase ID from Clerk ID
  useEffect(() => {
    const fetchUserData = async () => {
      if (isSignedIn && user?.id) {
        try {
          const userData = await getUserByClerkId(user.id);
          if (userData) {
            setUserFirebaseId(userData.id);
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      } else {
        // Reset state when user is not signed in
        setUserFirebaseId(null);
        setUnreadCount(0);
        setConversations([]);
      }
    };

    fetchUserData();
  }, [isSignedIn, user?.id]);

  // Step 2: Listen for conversations updates when userFirebaseId is available
  useEffect(() => {
    if (!userFirebaseId) {
      setLoading(false);
      return;
    }

    setLoading(true);

    // Query for all conversations where the user is a participant
    const conversationsRef = collection(db, "conversations");
    const q = query(
      conversationsRef,
      where("participants", "array-contains", userFirebaseId),
      orderBy("lastMessageTimestamp", "desc")
    );

    // Set up real-time listener
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const conversationList: ConversationWithId[] = [];
        let newUnreadCount = 0;

        snapshot.forEach((doc) => {
          const conversationData = {
            id: doc.id,
            ...doc.data(),
          } as ConversationWithId;

          // Add to conversations list
          conversationList.push(conversationData);

          // Count as unread if the last message is not from the current user and is part of an ongoing conversation
          if (
            conversationData.lastMessageSenderId &&
            conversationData.lastMessageSenderId !== userFirebaseId
          ) {
            // Set up listener for unread messages in this conversation
            setupUnreadMessagesListener(doc.id, userFirebaseId);
          }
        });

        setConversations(conversationList);
        setLoading(false);
      },
      (error) => {
        console.error("Error listening for conversations:", error);
        setLoading(false);
      }
    );

    // Cleanup listener on unmount or when userFirebaseId changes
    return () => {
      unsubscribe();
      // Also clean up any message listeners
      Object.values(messageListeners).forEach((unsub) => unsub());
      setMessageListeners({});
    };
  }, [userFirebaseId]);

  // Keep track of message listeners to avoid duplicates and allow cleanup
  const [messageListeners, setMessageListeners] = useState<{
    [conversationId: string]: () => void;
  }>({});

  // Set up listener for unread messages in a specific conversation
  const setupUnreadMessagesListener = (
    conversationId: string,
    userId: string
  ) => {
    // Clean up existing listener for this conversation if it exists
    if (messageListeners[conversationId]) {
      messageListeners[conversationId]();
    }

    // Set up new listener
    const messagesRef = collection(
      db,
      "conversations",
      conversationId,
      "messages"
    );
    const q = query(
      messagesRef,
      where("receiverId", "==", userId),
      where("isRead", "==", false)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        // Use a functional update to ensure we're working with the latest state
        setUnreadCount((prevCount) => {
          // Calculate the difference to avoid counting the same messages multiple times
          const conversationUnreadCount = snapshot.size;
          return prevCount + conversationUnreadCount;
        });
      },
      (error) => {
        console.error(
          `Error listening for unread messages in ${conversationId}:`,
          error
        );
      }
    );

    // Store the unsubscribe function
    messageListeners[conversationId] = unsubscribe;
  };

  // Provide context value to children
  const value = {
    unreadCount,
    conversations,
    loading,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

/**
 * Hook to access message notification data from the NotificationContext
 */
export function useMessageNotifications() {
  return useContext(NotificationContext);
}

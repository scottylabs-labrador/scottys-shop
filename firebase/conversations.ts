/**
 * Firebase operations for conversations and messages
 * Handles CRUD operations for the conversations collection and its messages subcollection
 */

import { db } from "@/firebase/firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
} from "firebase/firestore";
import { Conversation, Message } from "@/utils/types";
import { CONVERSATION_STATUS } from "@/utils/ConversationConstants";
import {
  addConversationToUser,
  removeConversationFromUser,
} from "@/firebase/users";
import { ITEM_TYPE } from "@/utils/ItemConstants";

/**
 * Firebase Collection: conversations
 * {
 *   participants: string[]; // Array of user IDs participating in the conversation
 *   itemId?: string; // Optional item ID that the conversation is about
 *   itemType?: typeof ITEM_TYPE[keyof typeof ITEM_TYPE]; // ITEM_TYPE.MARKETPLACE or ITEM_TYPE.COMMISSION
 *   lastMessageTimestamp: number;
 *   lastMessageText: string;
 *   lastMessageSenderId: string;
 *   createdAt: number;
 *   status: string; // "ongoing", "completed", "buyercancelled", "sellercancelled"
 * }
 *
 * Firebase Subcollection: conversations/{conversationId}/messages
 * {
 *   senderId: string;
 *   receiverId: string;
 *   content: string;
 *   isRead: boolean;
 *   createdAt: number;
 * }
 */

// Message with ID
export interface MessageWithId extends Message {
  id: string;
}

// Conversation with ID
export interface ConversationWithId extends Conversation {
  id: string;
}

const conversationsCollection = collection(db, "conversations");

// Create a new conversation
export const createConversation = async (
  conversationData: Omit<
    Conversation,
    | "lastMessageTimestamp"
    | "lastMessageText"
    | "lastMessageSenderId"
    | "status"
  >
): Promise<string> => {
  try {
    const fullConversationData: Conversation = {
      ...conversationData,
      lastMessageTimestamp: Date.now(),
      lastMessageText: "", // Initially empty
      lastMessageSenderId: "", // Initially empty
      status: CONVERSATION_STATUS.ONGOING, // Default status
    };

    const docRef = await addDoc(conversationsCollection, fullConversationData);
    const conversationId = docRef.id;

    // Add this conversation to both participants' user documents
    await Promise.all(
      conversationData.participants.map((userId) =>
        addConversationToUser(userId, conversationId)
      )
    );

    return conversationId;
  } catch (error) {
    console.error("Error creating conversation:", error);
    throw error;
  }
};

// Get a specific conversation
export const getConversationById = async (
  conversationId: string
): Promise<ConversationWithId | null> => {
  try {
    const conversationDoc = await getDoc(
      doc(conversationsCollection, conversationId)
    );
    if (conversationDoc.exists()) {
      return {
        id: conversationDoc.id,
        ...conversationDoc.data(),
      } as ConversationWithId;
    }
    return null;
  } catch (error) {
    console.error("Error getting conversation:", error);
    throw error;
  }
};

// Find an existing conversation between users about an item
export const findConversationByParticipantsAndItem = async (
  userId1: string,
  userId2: string,
  itemId?: string
): Promise<ConversationWithId | null> => {
  try {
    // We need to check for both possible orderings of participants
    const q1 = query(
      conversationsCollection,
      where("participants", "==", [userId1, userId2]),
      ...(itemId ? [where("itemId", "==", itemId)] : [])
    );

    const q2 = query(
      conversationsCollection,
      where("participants", "==", [userId2, userId1]),
      ...(itemId ? [where("itemId", "==", itemId)] : [])
    );

    const [snapshot1, snapshot2] = await Promise.all([
      getDocs(q1),
      getDocs(q2),
    ]);

    const docs = [...snapshot1.docs, ...snapshot2.docs];

    if (docs.length > 0) {
      // Return the first matching conversation
      return {
        id: docs[0].id,
        ...docs[0].data(),
      } as ConversationWithId;
    }

    return null;
  } catch (error) {
    console.error("Error finding conversation:", error);
    throw error;
  }
};

// Get all conversations for a user by conversation IDs
export const getConversationsByIds = async (
  conversationIds: string[]
): Promise<ConversationWithId[]> => {
  try {
    if (!conversationIds.length) return [];

    const conversationsPromises = conversationIds.map((id) =>
      getConversationById(id)
    );
    const conversations = await Promise.all(conversationsPromises);

    // Filter out null values and sort by last message timestamp
    return conversations.filter(
      (conv) => conv !== null
    ) as ConversationWithId[];
  } catch (error) {
    console.error("Error getting conversations by IDs:", error);
    throw error;
  }
};

// Get all conversations for a user
export const getConversationsByUserId = async (
  userId: string | null
): Promise<ConversationWithId[]> => {
  try {
    if (!userId) return [];

    const q = query(
      conversationsCollection,
      where("participants", "array-contains", userId),
      orderBy("lastMessageTimestamp", "desc")
    );

    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as ConversationWithId[];
  } catch (error) {
    console.error("Error getting conversations:", error);
    throw error;
  }
};

// Get conversation status
export const getConversationStatus = async (
  conversationId: string
): Promise<
  (typeof CONVERSATION_STATUS)[keyof typeof CONVERSATION_STATUS] | null
> => {
  try {
    const conversation = await getConversationById(conversationId);
    if (!conversation) {
      return null;
    }
    return conversation.status;
  } catch (error) {
    console.error("Error getting conversation status:", error);
    throw error;
  }
};

// Update conversation status
export const updateConversationStatus = async (
  conversationId: string,
  newStatus: (typeof CONVERSATION_STATUS)[keyof typeof CONVERSATION_STATUS]
): Promise<void> => {
  try {
    await updateDoc(doc(conversationsCollection, conversationId), {
      status: newStatus,
    });
  } catch (error) {
    console.error("Error updating conversation status:", error);
    throw error;
  }
};

// Get ongoing conversations for a user
export const getOngoingConversationsByUserId = async (
  userId: string
): Promise<ConversationWithId[]> => {
  try {
    const q = query(
      conversationsCollection,
      where("participants", "array-contains", userId),
      where("status", "==", CONVERSATION_STATUS.ONGOING),
      orderBy("lastMessageTimestamp", "desc")
    );

    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as ConversationWithId[];
  } catch (error) {
    console.error("Error getting ongoing conversations:", error);
    throw error;
  }
};

// Get completed conversations for a user
export const getCompletedConversationsByUserId = async (
  userId: string
): Promise<ConversationWithId[]> => {
  try {
    const q = query(
      conversationsCollection,
      where("participants", "array-contains", userId),
      where("status", "==", CONVERSATION_STATUS.COMPLETED),
      orderBy("lastMessageTimestamp", "desc")
    );

    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as ConversationWithId[];
  } catch (error) {
    console.error("Error getting completed conversations:", error);
    throw error;
  }
};

// Add message to a conversation
export const addMessageToConversation = async (
  conversationId: string,
  messageData: Omit<Message, "id" | "createdAt">
): Promise<string> => {
  try {
    const messagesCollection = collection(
      db,
      "conversations",
      conversationId,
      "messages"
    );

    const timestamp = Date.now();
    const completeMessageData: Omit<Message, "id"> = {
      ...messageData,
      createdAt: timestamp,
    };

    // Add the message to the conversation's messages subcollection
    const docRef = await addDoc(messagesCollection, completeMessageData);

    // Update the conversation with last message information
    await updateDoc(doc(conversationsCollection, conversationId), {
      lastMessageTimestamp: timestamp,
      lastMessageText: messageData.content,
      lastMessageSenderId: messageData.senderId,
    });

    return docRef.id;
  } catch (error) {
    console.error("Error adding message:", error);
    throw error;
  }
};

// Get messages for a conversation
export const getMessagesForConversation = async (
  conversationId: string,
  limitCount: number = 100
): Promise<MessageWithId[]> => {
  try {
    const messagesCollection = collection(
      db,
      "conversations",
      conversationId,
      "messages"
    );

    const q = query(
      messagesCollection,
      orderBy("createdAt", "asc"),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as MessageWithId[];
  } catch (error) {
    console.error("Error getting messages:", error);
    throw error;
  }
};

// Mark messages as read
export const markMessagesAsRead = async (
  conversationId: string,
  messageIds: string[]
): Promise<void> => {
  try {
    const messagesCollection = collection(
      db,
      "conversations",
      conversationId,
      "messages"
    );

    const updatePromises = messageIds.map((messageId) =>
      updateDoc(doc(messagesCollection, messageId), { isRead: true })
    );

    await Promise.all(updatePromises);
  } catch (error) {
    console.error("Error marking messages as read:", error);
    throw error;
  }
};

// Delete a conversation
export const deleteConversation = async (
  conversationId: string
): Promise<void> => {
  try {
    // First get the conversation to get participant IDs
    const conversation = await getConversationById(conversationId);
    if (!conversation) {
      throw new Error(`Conversation with ID ${conversationId} not found`);
    }

    // Remove the conversation from each participant's user document
    const removePromises = conversation.participants.map((userId) =>
      removeConversationFromUser(userId, conversationId)
    );

    await Promise.all(removePromises);

    // Then delete the conversation document
    await deleteDoc(doc(conversationsCollection, conversationId));
  } catch (error) {
    console.error("Error deleting conversation:", error);
    throw error;
  }
};

// Create a conversation with an initial message about an item
export const createItemPurchaseConversation = async (
  buyerId: string,
  sellerId: string,
  itemId: string,
  itemType: (typeof ITEM_TYPE)[keyof typeof ITEM_TYPE],
  initialMessage: string
): Promise<string> => {
  try {
    // First create the conversation
    const conversationData: Conversation = {
      participants: [buyerId, sellerId],
      itemId,
      itemType,
      createdAt: Date.now(),
      lastMessageTimestamp: Date.now(),
      lastMessageText: initialMessage,
      lastMessageSenderId: buyerId,
      status: CONVERSATION_STATUS.ONGOING,
    };

    const docRef = await addDoc(conversationsCollection, conversationData);
    const conversationId = docRef.id;

    // Add this conversation to both participants' user documents
    await Promise.all([
      addConversationToUser(buyerId, conversationId),
      addConversationToUser(sellerId, conversationId),
    ]);

    // Then add the initial message
    const messageData: Omit<Message, "id" | "createdAt"> = {
      senderId: buyerId,
      receiverId: sellerId,
      content: initialMessage,
      isRead: false,
    };

    await addMessageToConversation(conversationId, messageData);

    return conversationId;
  } catch (error) {
    console.error("Error creating purchase conversation:", error);
    throw error;
  }
};

// Get unread message count for a user
export const getUnreadMessageCount = async (
  userId: string
): Promise<number> => {
  try {
    let totalUnread = 0;

    // Get all conversations for the user
    const userConversationsPromise = getConversationsByUserId(userId);
    const conversations = await userConversationsPromise;

    // For each conversation, count unread messages
    for (const conversation of conversations) {
      const messagesCollection = collection(
        db,
        "conversations",
        conversation.id,
        "messages"
      );

      const q = query(
        messagesCollection,
        where("receiverId", "==", userId),
        where("isRead", "==", false)
      );

      const querySnapshot = await getDocs(q);
      totalUnread += querySnapshot.size;
    }

    return totalUnread;
  } catch (error) {
    console.error("Error getting unread message count:", error);
    throw error;
  }
};

// Get a default message template for item purchase
export const getItemPurchaseMessageTemplate = (
  itemTitle: string,
  itemType: (typeof ITEM_TYPE)[keyof typeof ITEM_TYPE]
): string => {
  const itemTypeFormatted = itemType === "commission" ? "commission" : "item";
  return `Hi! I'm interested in purchasing "${itemTitle}"`;
};

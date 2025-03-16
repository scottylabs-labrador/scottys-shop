"use client";

import { useEffect, useState, useRef, FormEvent } from "react";
import { useUser, SignIn } from "@clerk/nextjs";
import { useParams, useRouter } from "next/navigation";
import {
  getConversationById,
  getMessagesForConversation,
  addMessageToConversation,
  markMessagesAsRead,
  updateConversationStatus,
  type MessageWithId,
  type ConversationStatus,
} from "@/firebase/conversations";
import {
  getUserByClerkId,
  getUserById,
  type UserWithId,
} from "@/firebase/users";
import {
  getMPItemById,
  updateMPItemStatus,
  type MPItemWithId,
} from "@/firebase/mpItems";
import { getCommItemById, type CommItemWithId } from "@/firebase/commItems";
import { useToast } from "@/hooks/use-toast";
import Loading from "@/components/utils/Loading";
import { CONVERSATION_STATUS } from "@/utils/ConversationConstants";
import { MPITEM_STATUS } from "@/utils/ItemConstants";

// Import components directly
import ConversationHeader from "@/components/conversations/ConversationHeader";
import ConversationActionButtons from "@/components/conversations/ConversationActionButtons";
import MessageList from "@/components/conversations/MessageList";
import MessageInput from "@/components/conversations/MessageInput";
import ConversationStatusPreview from "@/components/conversations/ConversationStatusPreview";
import ErrorState from "@/components/conversations/ErrorState";

// Type for combined item data with type information
type ItemWithType = (MPItemWithId | CommItemWithId) & {
  type: "marketplace" | "commission";
};

export default function ConversationPage() {
  const params = useParams();
  const conversationId =
    typeof params.id === "string"
      ? params.id
      : Array.isArray(params.id)
        ? params.id[0]
        : "";
  const { user, isSignedIn, isLoaded } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  const messageEndRef = useRef<HTMLDivElement>(null);

  // State
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [messages, setMessages] = useState<MessageWithId[]>([]);
  const [userFirebaseId, setUserFirebaseId] = useState<string | null>(null);
  const [otherUser, setOtherUser] = useState<UserWithId | null>(null);
  const [itemData, setItemData] = useState<ItemWithType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [conversationStatus, setConversationStatus] =
    useState<ConversationStatus>(CONVERSATION_STATUS.ONGOING);
  const [isSeller, setIsSeller] = useState(false);

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

  // Fetch conversation, messages, other user, and item data
  useEffect(() => {
    const fetchConversationData = async () => {
      if (!conversationId || !userFirebaseId) return;

      setLoading(true);
      try {
        // Get conversation
        const conversation = await getConversationById(conversationId);
        if (!conversation) {
          setError("Conversation not found");
          setLoading(false);
          return;
        }

        // Check if user is a participant
        if (
          !conversation.participants ||
          !conversation.participants.includes(userFirebaseId)
        ) {
          setError("You don't have permission to view this conversation");
          setLoading(false);
          return;
        }

        // Set conversation status
        setConversationStatus(conversation.status);

        // Get other user
        const otherUserId = conversation.participants.find(
          (id) => id !== userFirebaseId
        );
        if (otherUserId) {
          const otherUserData = await getUserById(otherUserId);
          if (otherUserData) {
            setOtherUser(otherUserData);
          }
        }

        // Get messages
        const messagesData = await getMessagesForConversation(conversationId);
        setMessages(messagesData);

        // Get item data if conversation is about an item
        if (conversation.itemId) {
          try {
            // Determine item type
            const itemType = conversation.itemType || "marketplace"; // Default to marketplace if not specified

            if (itemType === "commission") {
              const item = await getCommItemById(conversation.itemId);
              if (item) {
                setItemData({
                  ...item,
                  type: "commission" as const,
                });

                // Check if user is the seller
                setIsSeller(item.sellerId === userFirebaseId);
              }
            } else {
              const item = await getMPItemById(conversation.itemId);
              if (item) {
                setItemData({
                  ...item,
                  type: "marketplace" as const,
                });

                // Check if user is the seller
                setIsSeller(item.sellerId === userFirebaseId);
              }
            }
          } catch (itemError) {
            console.error("Error fetching item:", itemError);
          }
        }

        // Mark messages as read
        const unreadMessages = messagesData
          .filter((msg) => !msg.isRead && msg.receiverId === userFirebaseId)
          .map((msg) => msg.id);

        if (unreadMessages.length > 0) {
          await markMessagesAsRead(conversationId, unreadMessages);
        }
      } catch (error) {
        console.error("Error fetching conversation data:", error);
        setError("Failed to load conversation");
        toast({
          title: "Error",
          description: "Failed to load conversation",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchConversationData();
  }, [conversationId, userFirebaseId, toast]);

  // Scroll to bottom when loading is completed or messages change
  useEffect(() => {
    // Small timeout to ensure DOM is fully rendered
    const timeoutId = setTimeout(() => {
      if (messageEndRef.current && !loading) {
        messageEndRef.current.scrollIntoView({
          behavior: "smooth",
          block: "end",
        });
      }
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [messages, loading]);

  // Send message
  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !userFirebaseId || !otherUser) return;

    setSending(true);
    try {
      const messageData = {
        senderId: userFirebaseId,
        receiverId: otherUser.id,
        content: newMessage.trim(),
        isRead: false,
      };

      await addMessageToConversation(conversationId, messageData);
      setNewMessage("");

      // Refresh messages
      const messagesData = await getMessagesForConversation(conversationId);
      setMessages(messagesData);
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  // Mark as completed (sold)
  const handleMarkAsCompleted = async () => {
    if (!conversationId || !itemData || !isSeller) return;

    setProcessing(true);
    try {
      // Update conversation status
      await updateConversationStatus(
        conversationId,
        CONVERSATION_STATUS.COMPLETED
      );

      // If it's a marketplace item, also update the item status
      if (itemData.type === "marketplace") {
        await updateMPItemStatus(itemData.id, MPITEM_STATUS.SOLD);
      }

      // Send system message
      const systemMessage = {
        senderId: userFirebaseId!,
        receiverId: otherUser!.id,
        content: "This item has been marked as sold.",
        isRead: false,
      };

      await addMessageToConversation(conversationId, systemMessage);

      // Update local state
      setConversationStatus(CONVERSATION_STATUS.COMPLETED);

      // Refresh messages
      const messagesData = await getMessagesForConversation(conversationId);
      setMessages(messagesData);

      toast({
        title: "Success",
        description: "The conversation has been marked as completed",
      });
    } catch (error) {
      console.error("Error marking as completed:", error);
      toast({
        title: "Error",
        description: "Failed to mark as completed",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  // Cancel as seller
  const handleSellerCancel = async () => {
    if (!conversationId || !itemData || !isSeller) return;

    setProcessing(true);
    try {
      // Update conversation status
      await updateConversationStatus(
        conversationId,
        CONVERSATION_STATUS.SELLER_CANCELLED
      );

      // Send system message
      const systemMessage = {
        senderId: userFirebaseId!,
        receiverId: otherUser!.id,
        content: "The seller has cancelled this transaction.",
        isRead: false,
      };

      await addMessageToConversation(conversationId, systemMessage);

      // Update local state
      setConversationStatus(CONVERSATION_STATUS.SELLER_CANCELLED);

      // Refresh messages
      const messagesData = await getMessagesForConversation(conversationId);
      setMessages(messagesData);

      toast({
        title: "Cancelled",
        description: "You have cancelled this transaction",
      });
    } catch (error) {
      console.error("Error cancelling as seller:", error);
      toast({
        title: "Error",
        description: "Failed to cancel transaction",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  // Cancel as buyer
  const handleBuyerCancel = async () => {
    if (!conversationId || !itemData || isSeller) return;

    setProcessing(true);
    try {
      // Update conversation status
      await updateConversationStatus(
        conversationId,
        CONVERSATION_STATUS.BUYER_CANCELLED
      );

      // Send system message
      const systemMessage = {
        senderId: userFirebaseId!,
        receiverId: otherUser!.id,
        content: "The buyer has cancelled this transaction.",
        isRead: false,
      };

      await addMessageToConversation(conversationId, systemMessage);

      // Update local state
      setConversationStatus(CONVERSATION_STATUS.BUYER_CANCELLED);

      // Refresh messages
      const messagesData = await getMessagesForConversation(conversationId);
      setMessages(messagesData);

      toast({
        title: "Cancelled",
        description: "You have cancelled this transaction",
      });
    } catch (error) {
      console.error("Error cancelling as buyer:", error);
      toast({
        title: "Error",
        description: "Failed to cancel transaction",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const navigateBack = () => {
    router.push("/messages");
  };

  // Check if conversation is active
  const isConversationActive =
    conversationStatus === CONVERSATION_STATUS.ONGOING;

  if (!isLoaded) {
    return (
      <div className="flex justify-center items-center h-[80vh]">
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

  if (loading) {
    return (
      <div className="container mx-auto py-8 text-center">
        <Loading />
      </div>
    );
  }

  if (error) {
    return <ErrorState error={error} onBackClick={navigateBack} />;
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-3xl">
      {/* Header with back button and recipient info */}
      <ConversationHeader
        title={
          itemData
            ? itemData.title
            : `Conversation with ${otherUser?.name || "User"}`
        }
        status={conversationStatus}
        otherUser={otherUser}
        isSeller={isSeller}
        onBackClick={navigateBack}
      />

      {/* Messages container with inline status preview */}
      <div className="bg-gray-50 rounded-lg border min-h-[60vh] max-h-[50vh] overflow-y-auto p-4 flex flex-col gap-4">
        {/* If we have at least one message, show messages */}
        {messages.length > 0 ? (
          <>
            <MessageList
              messages={messages}
              userFirebaseId={userFirebaseId}
              itemData={itemData}
              messageEndRef={null}
            />

            {/* Only show status preview if not in active state */}
            {itemData && (
              <ConversationStatusPreview
                status={conversationStatus}
                itemType={itemData.type}
                isSeller={isSeller}
              />
            )}

            {/* Invisible element for scrolling to bottom */}
            <div ref={messageEndRef} className="h-1" />
          </>
        ) : (
          // If no messages, show empty message indicator. SHOULD NOT HAPPEN
          <>
            <div className="text-center text-gray-500 my-auto">
              <p>No messages yet</p>
              <p className="text-sm">
                Start the conversation by sending a message
              </p>
            </div>

            <div ref={messageEndRef} className="h-1" />
          </>
        )}
      </div>

      {/* Action buttons */}
      {itemData && (
        <div className="mt-4 mb-3">
          <ConversationActionButtons
            isSeller={isSeller}
            isActive={isConversationActive}
            itemType={itemData.type}
            processing={processing}
            onMarkCompleted={handleMarkAsCompleted}
            onSellerCancel={handleSellerCancel}
            onBuyerCancel={handleBuyerCancel}
          />
        </div>
      )}

      {/* Message input */}
      <MessageInput
        newMessage={newMessage}
        sending={sending}
        isActive={isConversationActive}
        onChangeMessage={setNewMessage}
        onSendMessage={handleSendMessage}
      />
    </div>
  );
}

/**
 * Scrollable container for Conversation Previews
 * Brings active conversation to the top of the list
 * Shows conversations with unread messages at the top
 */

"use client";

import React, { useState, useEffect } from "react";
import {
  getConversationById,
  type ConversationWithId,
} from "@/firebase/conversations";
import { type UserWithId } from "@/firebase/users";
import { Card } from "@/components/ui/card";
import ConversationPreview from "@/components/conversations/ConversationPreview";
import {
  UsersDataRecord,
  ItemsDataRecord,
  PREVIEW_STATUS,
} from "@/utils/ConversationConstants";
import { Loader2 } from "lucide-react";

interface ConversationListProps {
  userFirebaseId: string | null;
  itemsData: ItemsDataRecord;
  usersData: UsersDataRecord;
  activeConversationId: string | null;
  unreadConversations: ConversationWithId[];
  readConversations: ConversationWithId[];
}

const ConversationList: React.FC<ConversationListProps> = ({
  userFirebaseId,
  itemsData,
  usersData,
  activeConversationId,
  unreadConversations,
  readConversations,
}) => {
  // Core state
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeConversation, setActiveConversation] =
    useState<ConversationWithId | null>(null);

  // Get user Firebase ID from Clerk ID
  useEffect(() => {
    const fetchActiveConversation = async () => {
      if (!activeConversationId) {
        setActiveConversation(null);
        setIsLoading(false);
        return;
      }

      try {
        let conversation = await getConversationById(activeConversationId);
        setActiveConversation(conversation);
      } catch (err) {
        setError("Failed to load active conversation");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchActiveConversation();
  }, [activeConversationId]);

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg border shadow-sm">
        <div className="flex flex-col items-center space-y-3">
          <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
          <p className="text-sm text-gray-600 font-medium">
            Loading conversations...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-8 text-center shadow-sm border-red-100 bg-red-50">
        <p className="text-red-500 mb-4 font-medium">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
        >
          Try Again
        </button>
      </Card>
    );
  }

  return (
    <div className="container mx-auto font-rubik bg-white rounded-lg shadow-sm border p-4 max-h-[80vh] h-full overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
      {unreadConversations.length === 0 &&
      readConversations.length === 0 &&
      !activeConversation ? (
        <div className="text-center py-10 bg-gray-50 rounded-lg border">
          <svg
            className="w-12 h-12 mx-auto text-gray-400 mb-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
            />
          </svg>
          <p className="text-gray-600 font-medium mb-2">No conversations yet</p>
          <p className="text-gray-500 text-sm px-6">
            Visit the marketplace and commissions pages to browse items and
            message sellers.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Active Conversation */}
          {activeConversation && (
            <div className="animate-fadeIn">
              <span className="text-xs font-semibold text-gray-600 pl-2 flex items-center mb-2">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                CURRENT CONVERSATION
              </span>

              <ConversationPreview
                conversation={activeConversation}
                otherUser={getOtherParticipant(activeConversation)}
                item={
                  activeConversation.itemId
                    ? itemsData[activeConversation.itemId]
                    : null
                }
                userFirebaseId={userFirebaseId}
                state={PREVIEW_STATUS.ACTIVE}
              />
            </div>
          )}

          {/* Unread Conversations */}
          {unreadConversations.length > 0 && (
            <div className="mt-3">
              <span className="text-xs font-semibold text-gray-600 pl-2 flex items-center mb-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                UNREAD CONVERSATIONS
              </span>

              <div className="space-y-2">
                {unreadConversations
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
                      state={PREVIEW_STATUS.UNREAD}
                    />
                  ))}
              </div>
            </div>
          )}

          {/* Read Conversations */}
          {readConversations.length > 0 && (
            <div className="mt-3">
              <span className="text-xs font-semibold text-gray-600 pl-2 flex items-center mb-2">
                <span className="w-2 h-2 bg-gray-400 rounded-full mr-2"></span>
                READ CONVERSATIONS
              </span>

              <div className="space-y-2">
                {readConversations
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
                      state={PREVIEW_STATUS.READ}
                    />
                  ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ConversationList;

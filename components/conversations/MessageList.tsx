/**
 * Displays a list of messages in a conversation
 * Renders message bubbles and handles different message types
 */
import React, { RefObject } from "react";
import { format } from "date-fns";
import { MessageWithId } from "@/firebase/conversations";
import ItemPreview from "@/components/items/ItemPreview";

interface MessageListProps {
  messages: MessageWithId[];
  userFirebaseId: string | null;
  itemData: any;
  messageEndRef: RefObject<HTMLDivElement> | null;
}

const MessageList: React.FC<MessageListProps> = ({
  messages,
  userFirebaseId,
  itemData,
  messageEndRef,
}) => {
  // Format message timestamp
  const formatMessageTime = (timestamp: number): string => {
    try {
      return format(new Date(timestamp), "h:mm a");
    } catch (error) {
      return "";
    }
  };

  if (messages.length === 0) {
    return (
      <div className="text-center text-gray-500 my-auto">
        <p>No messages yet</p>
        <p className="text-sm">Start the conversation by sending a message</p>
      </div>
    );
  }

  return (
    <>
      {messages.map((message, index) => {
        const isCurrentUser = message.senderId === userFirebaseId;
        const showItemPreview = index === 0 && itemData;
        const isSystemMessage =
          message.content.startsWith("This item has been marked as sold") ||
          message.content.includes("has cancelled this transaction");

        return (
          <div key={message.id}>
            <div
              className={`flex ${
                isCurrentUser ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] ${
                  isSystemMessage
                    ? "bg-gray-200 text-gray-800 rounded-lg border border-gray-300"
                    : isCurrentUser
                      ? "bg-blue-500 text-white rounded-tl-lg rounded-tr-lg rounded-bl-lg"
                      : "bg-white border rounded-tl-lg rounded-tr-lg rounded-br-lg"
                } px-4 py-2 shadow-sm`}
              >
                <div className={`text-sm ${isSystemMessage ? "italic" : ""}`}>
                  {message.content}
                </div>
                <div
                  className={`text-xs mt-1 ${
                    isSystemMessage
                      ? "text-gray-600"
                      : isCurrentUser
                        ? "text-blue-100"
                        : "text-gray-500"
                  }`}
                >
                  {formatMessageTime(message.createdAt)}
                </div>
              </div>
            </div>

            {/* Display item preview after the first message if it's about an item */}
            {showItemPreview && (
              <div
                className={`mt-2 ${
                  isCurrentUser ? "ml-auto" : "mr-auto"
                } max-w-[50%]`}
              >
                <ItemPreview item={itemData} itemType={itemData.type} />
              </div>
            )}
          </div>
        );
      })}
      {messageEndRef && <div ref={messageEndRef} />}
    </>
  );
};

export default MessageList;

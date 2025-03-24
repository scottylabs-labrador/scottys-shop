/**
 * Header component for conversation view
 * Shows conversation title, status, and participants
 */
import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { UserWithId } from "@/firebase/users";
import { CONVERSATION_STATUS } from "@/utils/ConversationConstants";

interface ConversationHeaderProps {
  title: string;
  status: string;
  otherUser: UserWithId | null;
  isSeller: boolean;
  onBackClick: () => void;
}

const ConversationHeader: React.FC<ConversationHeaderProps> = ({
  title,
  status,
  otherUser,
  isSeller,
  onBackClick,
}) => {
  // Generate status badge
  const getStatusBadge = () => {
    switch (status) {
      case CONVERSATION_STATUS.ONGOING:
        return (
          <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-medium">
            Ongoing
          </span>
        );
      case CONVERSATION_STATUS.COMPLETED:
        return (
          <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">
            Completed
          </span>
        );
      case CONVERSATION_STATUS.BUYER_CANCELLED:
        return (
          <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-medium">
            Cancelled by Buyer
          </span>
        );
      case CONVERSATION_STATUS.SELLER_CANCELLED:
        return (
          <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded-full text-xs font-medium">
            Cancelled by Seller
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex items-center mb-4">
      <Button variant="ghost" className="mr-2" onClick={onBackClick}>
        <ArrowLeft className="h-4 w-4" />
      </Button>

      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold truncate">{title}</h1>
          {getStatusBadge()}
        </div>

        {otherUser && (
          <p className="text-sm text-gray-500">
            {isSeller
              ? `Buyer: @${otherUser.andrewId || "User"}`
              : `Seller: @${otherUser.andrewId || "User"}`}
          </p>
        )}
      </div>
    </div>
  );
};

export default ConversationHeader;

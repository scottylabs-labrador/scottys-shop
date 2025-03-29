/**
 * Displays the current status of a conversation
 * Shows visual indicators for completed, cancelled, and ongoing conversations
 */
import React from "react";
import { CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { CONVERSATION_STATUS } from "@/utils/ConversationConstants";

type ItemType = "marketplace" | "commission";

interface ConversationStatusPreviewProps {
  status: string;
  itemType: ItemType;
  isSeller: boolean;
}

const ConversationStatusPreview: React.FC<ConversationStatusPreviewProps> = ({
  status,
  itemType,
  isSeller,
}) => {
  // Don't render anything if the conversation is ongoing/active
  if (status === CONVERSATION_STATUS.ONGOING) {
    return null;
  }

  // Get appropriate message and styling based on status and user role
  const getStatusDetails = () => {
    switch (status) {
      case CONVERSATION_STATUS.COMPLETED:
        return {
          icon: <CheckCircle className="h-10 w-10 text-green-600" />,
          bgColor: "bg-gradient-to-br from-green-50 to-green-100",
          borderColor: "border-green-200",
          textColor: "text-green-800",
          title: isSeller ? "Item Sold" : "Purchase Confirmed",
          message: isSeller
            ? "You've successfully sold this item."
            : "Your purchase has been confirmed by the seller.",
          accentClass: "border-l-4 border-l-green-500",
        };

      case CONVERSATION_STATUS.BUYER_CANCELLED:
        return {
          icon: <XCircle className="h-10 w-10 text-red-600" />,
          bgColor: "bg-gradient-to-br from-red-50 to-red-100",
          borderColor: "border-red-200",
          textColor: "text-red-800",
          title: "Purchase Cancelled",
          message: isSeller
            ? "The buyer has cancelled their purchase."
            : "You've cancelled this purchase.",
          accentClass: "border-l-4 border-l-red-500",
        };

      case CONVERSATION_STATUS.SELLER_CANCELLED:
        return {
          icon: <XCircle className="h-10 w-10 text-orange-600" />,
          bgColor: "bg-gradient-to-br from-orange-50 to-orange-100",
          borderColor: "border-orange-200",
          textColor: "text-orange-800",
          title: "Sale Cancelled",
          message: isSeller
            ? "You've cancelled this sale."
            : "The seller has cancelled this sale.",
          accentClass: "border-l-4 border-l-orange-500",
        };

      default:
        return {
          icon: <AlertCircle className="h-10 w-10 text-gray-600" />,
          bgColor: "bg-gradient-to-br from-gray-50 to-gray-100",
          borderColor: "border-gray-200",
          textColor: "text-gray-800",
          title: "Unknown Status",
          message: "The status of this conversation is unknown.",
          accentClass: "border-l-4 border-l-gray-500",
        };
    }
  };

  const { icon, bgColor, borderColor, textColor, title, message, accentClass } =
    getStatusDetails();

  return (
    <div
      className={`rounded-lg border ${borderColor} ${bgColor} p-6 my-6 mx-auto w-5/6 shadow-md ${accentClass}`}
    >
      <div className="flex flex-col items-center text-center">
        <div className="flex-shrink-0 mb-3 bg-white p-3 rounded-full shadow-sm">
          {icon}
        </div>
        <div>
          <h3 className={`text-xl font-bold ${textColor}`}>{title}</h3>
          <div className={`mt-2 text-md ${textColor} opacity-90 px-6`}>
            <p className="font-medium">{message}</p>
            {itemType === "marketplace" &&
              status === CONVERSATION_STATUS.COMPLETED && (
                <p className="mt-3">
                  {isSeller
                    ? "The item's status has been updated to 'Sold' in your marketplace listings."
                    : "The item is no longer available to other buyers."}
                </p>
              )}
            {itemType === "commission" &&
              status === CONVERSATION_STATUS.COMPLETED && (
                <p className="mt-3">
                  {isSeller
                    ? "This commission has been marked as completed."
                    : "This commission has been marked as completed by the seller."}
                </p>
              )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConversationStatusPreview;

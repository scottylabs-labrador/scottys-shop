/**
 * Action buttons for conversations
 * Provides functionality to mark conversations as completed or cancelled
 */
import React from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface ConversationActionButtonsProps {
  isSeller: boolean;
  isActive: boolean;
  itemType: "marketplace" | "commission";
  processing: boolean;
  onMarkCompleted: () => Promise<void>;
  onSellerCancel: () => Promise<void>;
  onBuyerCancel: () => Promise<void>;
}

const ConversationActionButtons: React.FC<ConversationActionButtonsProps> = ({
  isSeller,
  isActive,
  itemType,
  processing,
  onMarkCompleted,
  onSellerCancel,
  onBuyerCancel,
}) => {
  if (!isActive) {
    return null;
  }

  return (
    <div className="flex gap-2 mb-4">
      {/* Seller actions */}
      {isSeller && (
        <>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                disabled={processing}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Mark as Sold
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirm Sale</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to mark this item as sold?
                  {itemType === "marketplace" &&
                    " This will update the item's status in the marketplace."}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={onMarkCompleted}>
                  Confirm
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                disabled={processing}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Cancel Sale
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Cancel Sale</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to cancel this transaction? This cannot
                  be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>No, go back</AlertDialogCancel>
                <AlertDialogAction
                  onClick={onSellerCancel}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Yes, cancel sale
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}

      {/* Buyer actions */}
      {!isSeller && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
              disabled={processing}
            >
              <XCircle className="h-4 w-4 mr-2" />
              I'm No Longer Interested
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Close Conversation</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to close this conversation? This cannot be
                undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>No, go back</AlertDialogCancel>
              <AlertDialogAction
                onClick={onBuyerCancel}
                className="bg-red-600 hover:bg-red-700"
              >
                Yes, close conversation
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
};

export default ConversationActionButtons;

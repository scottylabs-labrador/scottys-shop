"use client";
import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Store, Pencil, LayoutDashboardIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ItemCard from "@/components/items/itemcard/ItemCard";
import ItemDashboard from "@/components/shop/ItemDashboard";
import { getCommItemsBySeller } from "@/firebase/commItems";
import { getMPItemsBySeller } from "@/firebase/mpItems";
import { useToast } from "@/hooks/use-toast";
import { ITEM_TYPE } from "@/utils/ItemConstants";
import Loading from "@/components/utils/Loading";

// Interface for shop items (both marketplace and commission types)
interface ShopItem {
  id: string;
  type: "MARKETPLACE" | "COMMISSION";
  price: number;
  category: string;
  condition?: string;
  turnaroundDays?: number;
}

interface ShopDisplayProps {
  sellerId: string;
  isOwnShop?: boolean;
  isDashboard?: boolean;
  isEditing?: boolean;
  handleEditClick?: (e: React.MouseEvent) => void;
}

export default function ShopDisplay({
  sellerId,
  isOwnShop = false,
  isDashboard = false,
  isEditing = false,
  handleEditClick,
}: ShopDisplayProps) {
  // State for managing component
  const [allItems, setAllItems] = useState<ShopItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const { toast } = useToast();

  // Load all shop items when sellerId changes
  useEffect(() => {
    fetchItems();
  }, [sellerId]);

  const fetchItems = async () => {
    if (!sellerId) return;

    setLoading(true);
    try {
      // Fetch both item types in parallel for efficiency
      const [commItems, mpItems] = await Promise.all([
        getCommItemsBySeller(sellerId),
        getMPItemsBySeller(sellerId),
      ]);

      // Map commission items
      const formattedCommItems = commItems.map((item) => ({
        id: item.id,
        type: "COMMISSION" as const,
        price: item.price,
        category: item.category,
        turnaroundDays: item.turnaroundDays,
      }));

      // Map marketplace items
      const formattedMpItems = mpItems.map((item) => ({
        id: item.id,
        type: "MARKETPLACE" as const,
        price: item.price,
        category: item.category,
        condition: item.condition,
      }));

      // Combine both types of items into a single array
      setAllItems([...formattedCommItems, ...formattedMpItems]);
    } catch (error) {
      console.error("Error fetching items:", error);
      toast({
        title: "Error",
        description: "Failed to load items",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleManageItems = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsManageModalOpen(true);
  };

  const handleModalClose = () => {
    setIsManageModalOpen(false);
    // Refresh items when modal is closed to reflect any changes
    fetchItems();
  };

  // Component to display when there are no items
  const EmptyState = () => (
    <div className="col-span-full flex items-center justify-center py-8">
      <Card className="w-full max-w-lg bg-white">
        <div className="flex flex-col items-center gap-6 p-10">
          <div className="rounded-full bg-gray-50 p-4">
            <Store className="h-8 w-8 text-gray-400" />
          </div>
          <div className="text-center">
            <h3 className="font-serif text-xl text-gray-900">No Items</h3>
            <p className="mt-2 text-sm text-gray-500">
              {isOwnShop
                ? "You haven't added any items to your shop yet."
                : "This creator hasn't added any items to their shop yet."}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="mx-auto max-w-7xl py-4">
      {/* Header with action buttons */}
      <div className="flex items-end justify-between mb-4">
        <h1 className="text-3xl font-rubik font-semibold text-gray-900 leading-tight">
          Shop Items
        </h1>
        {isOwnShop && isDashboard && (
          <div className="flex gap-5">
            {!isEditing && (
              <div
                onClick={handleEditClick}
                className="flex text-sm font-rubik font-semibold items-center text-blue-600 hover:text-blue-800 cursor-pointer"
              >
                <Pencil strokeWidth={3} className="w-4 h-4 mr-1" />
                <span>Edit Shop</span>
              </div>
            )}

            {isDashboard && (
              <div
                onClick={handleManageItems}
                className="flex text-sm font-rubik font-semibold items-center text-blue-600 hover:text-blue-800 cursor-pointer"
              >
                <LayoutDashboardIcon strokeWidth={3} className="w-4 h-4 mr-1" />
                <span>Manage Items</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Items grid */}
      {allItems.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
          {allItems.map((item) => (
            <div key={item.id} className="flex justify-center">
              <ItemCard
                itemId={item.id}
                type={item.type === "COMMISSION" ? "Commission" : "Marketplace"}
                isDashboard={false}
              />
            </div>
          ))}
        </div>
      ) : (
        <EmptyState />
      )}

      {/* Manage Items Modal */}
      <Dialog open={isManageModalOpen} onOpenChange={handleModalClose}>
        <DialogContent className="max-w-screen-xl w-[90%] h-[90vh] overflow-y-auto px-10">
          <div>
            <DialogTitle className="text-2xl font-rubik font-semibold">
              Manage Shop Items
            </DialogTitle>
            <ItemDashboard sellerId={sellerId} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

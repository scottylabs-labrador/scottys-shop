/**
 * Dashboard for managing shop items
 * Allows shop owners to create, edit, and manage their items
 */
"use client";
import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { PlusCircle, Store, PackageOpen } from "lucide-react";
import ItemCard from "@/components/items/itemcard/ItemCard";
import { getCommItemsBySeller } from "@/firebase/commItems";
import { getMPItemsBySeller } from "@/firebase/mpItems";
import { useRouter } from "next/navigation";
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

interface ItemDashboardProps {
  sellerId: string;
  isModal?: boolean;
}

export default function ItemDashboard({
  sellerId,
  isModal = false,
}: ItemDashboardProps) {
  // State for managing component
  const [activeTab, setActiveTab] = useState<"marketplace" | "commission">(
    "commission"
  );
  const [commissionItems, setCommissionItems] = useState<ShopItem[]>([]);
  const [marketplaceItems, setMarketplaceItems] = useState<ShopItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Hooks
  const router = useRouter();
  const { toast } = useToast();

  // Load shop items when sellerId changes
  useEffect(() => {
    const initializeComponent = async () => {
      setLoading(true);
      await refreshItems();
      setLoading(false);
    };

    initializeComponent();
  }, [sellerId]);

  // Navigate to item creation page
  const handleCreateItem = () => {
    router.push(`/item/create?type=${activeTab}`);
  };

  // Fetch and refresh both commission and marketplace items
  const refreshItems = async () => {
    if (!sellerId) return;

    try {
      // Fetch both item types in parallel for efficiency
      const [commItems, mpItems] = await Promise.all([
        getCommItemsBySeller(sellerId),
        getMPItemsBySeller(sellerId),
      ]);

      // Map commission items to a consistent format
      setCommissionItems(
        commItems.map((item) => ({
          id: item.id,
          type: "COMMISSION" as const,
          price: item.price,
          category: item.category,
          turnaroundDays: item.turnaroundDays,
        }))
      );

      // Map marketplace items to a consistent format
      setMarketplaceItems(
        mpItems.map((item) => ({
          id: item.id,
          type: "MARKETPLACE" as const,
          price: item.price,
          category: item.category,
          condition: item.condition,
        }))
      );
    } catch (error) {
      console.error("Error refreshing items:", error);
      toast({
        title: "Error",
        description: "Failed to refresh items",
        variant: "destructive",
      });
    }
  };

  // Component to display when there are no items in a tab
  const EmptyState = ({ type }: { type: "marketplace" | "commission" }) => (
    <div className="col-span-full flex items-center justify-center py-8">
      <Card className="w-full max-w-lg bg-white">
        <div className="flex flex-col items-center gap-6 p-10">
          {/* Icon for each tab type */}
          <div className="rounded-full bg-gray-50 p-4">
            {type === "marketplace" ? (
              <Store className="h-8 w-8 text-gray-400" />
            ) : (
              <PackageOpen className="h-8 w-8 text-gray-400" />
            )}
          </div>
          <div className="text-center">
            <h3 className="font-serif text-xl text-gray-900">
              No {type === "marketplace" ? "Marketplace" : "Commission"} Items
            </h3>

            <p className="mt-2 text-sm text-gray-500">
              Create your first {type} item by clicking the '+' button.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );

  const CreateItemCard = () => (
    <Card
      className="group flex h-[375px] flex-col items-center justify-center border-2 border-dashed border-gray-300 bg-gray-50 p-6 hover:bg-gray-100 hover:border-gray-400 cursor-pointer transition-all"
      onClick={handleCreateItem}
    >
      <div className="flex flex-col items-center gap-4 text-center font-rubik">
        <div className="rounded-full bg-white p-3 shadow-sm group-hover:bg-blue-50">
          <PlusCircle className="h-8 w-8 text-blue-500" />
        </div>
        <div>
          <h3 className="font-medium text-gray-900">
            Create New{" "}
            {activeTab === "marketplace" ? "Marketplace" : "Commission"} Item
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {activeTab === "marketplace"
              ? "Add a new marketplace item to your shop"
              : "Add a new commission item to your shop"}
          </p>
        </div>
      </div>
    </Card>
  );

  if (loading) {
    return <Loading />;
  }

  // Define the content based on active tab for normal dashboard view
  const renderContent = () => {
    const items =
      activeTab === "commission" ? commissionItems : marketplaceItems;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {/* Create button always appears in editor */}
        <CreateItemCard />

        {items.length > 0 ? (
          items.map((item) => (
            <div key={item.id} className="flex justify-center">
              <ItemCard
                itemId={item.id}
                type={
                  item.type === "COMMISSION"
                    ? ITEM_TYPE.COMMISSION
                    : ITEM_TYPE.MARKETPLACE
                }
                isDashboard={true}
                onItemDeleted={refreshItems}
              />
            </div>
          ))
        ) : (
          // Show empty state if no items
          <EmptyState type={activeTab} />
        )}
      </div>
    );
  };

  // Return different layout based on whether we're in a modal or not
  return (
    <div className={isModal ? "w-full" : "mt-4 max-w-7xl mx-auto"}>
      {/* Tabs */}
      <div className="flex mb-4">
        <div className="flex space-x-8 text-left font-rubik font-semibold">
          <button
            onClick={() => setActiveTab("commission")}
            className={`py-2 px-0 text-sm border-b-[3px] transition-colors ${
              activeTab === "commission"
                ? "border-blue-500 text-gray-900 font-medium"
                : "border-transparent text-gray-400 hover:text-gray-500"
            }`}
          >
            Commissions
          </button>

          <button
            onClick={() => setActiveTab("marketplace")}
            className={`py-2 px-0 text-sm border-b-[3px] transition-colors ${
              activeTab === "marketplace"
                ? "border-blue-500 text-gray-900 font-medium"
                : "border-transparent text-gray-400 hover:text-gray-500"
            }`}
          >
            Marketplace
          </button>
        </div>
      </div>

      {/* Content container */}
      <div className="mt-0">{renderContent()}</div>
    </div>
  );
}

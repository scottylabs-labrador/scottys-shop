/**
 * Dashboard for managing shop items
 * Allows shop owners to create, edit, and manage their items
 */
"use client";
import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { PlusCircle, Store, PackageOpen } from "lucide-react";
import ItemCard from "@/components/items/ItemCard";
import { ShopItem, AndrewID } from "@/utils/types";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { ITEM_TYPE } from "@/utils/itemConstants";
import Loading from "@/components/utils/Loading";

interface ItemDashboardProps {
  andrewId: AndrewID;
}

export default function ItemDashboard({ andrewId }: ItemDashboardProps) {
  const [activeTab, setActiveTab] = useState<"marketplace" | "commission">(
    "commission"
  );
  const [commissionItems, setCommissionItems] = useState<ShopItem[]>([]);
  const [marketplaceItems, setMarketplaceItems] = useState<ShopItem[]>([]);
  const [loading, setLoading] = useState(true);

  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const initializeComponent = async () => {
      setLoading(true);
      await refreshItems();
      setLoading(false);
    };

    initializeComponent();
  }, [andrewId]);

  const handleCreateItem = () => {
    router.push(`/item/create?type=${activeTab}`);
  };

  const refreshItems = async () => {
    if (!andrewId) return;

    try {
      // Fetch items via API using andrewId
      const [commResponse, mpResponse] = await Promise.all([
        fetch(`/api/users/${andrewId}/items/commission`),
        fetch(`/api/users/${andrewId}/items/marketplace`),
      ]);

      const commItems = commResponse.ok ? await commResponse.json() : [];
      const mpItems = mpResponse.ok ? await mpResponse.json() : [];

      setCommissionItems(
        commItems.map((item: any) => ({
          id: item.id,
          type: "COMMISSION" as const,
          price: item.price,
          category: item.category,
        }))
      );

      setMarketplaceItems(
        mpItems.map((item: any) => ({
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

  const EmptyState = ({ type }: { type: "marketplace" | "commission" }) => (
    <div className="col-span-full flex items-center justify-center py-8">
      <Card className="w-full max-w-lg bg-white">
        <div className="flex flex-col items-center gap-6 p-10">
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

  const renderContent = () => {
    const items =
      activeTab === "commission" ? commissionItems : marketplaceItems;

    return (
      <div className="grid sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-4">
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
          <EmptyState type={activeTab} />
        )}
      </div>
    );
  };

  return (
    <div className="w-full">
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
      <div className="mt-0">{renderContent()}</div>
    </div>
  );
}

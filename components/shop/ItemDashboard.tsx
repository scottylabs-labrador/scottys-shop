/**
 * Dashboard for managing shop items
 * Allows shop owners to create, edit, and manage their items
 * Requires payment methods to be configured before creating items
 */
"use client";
import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { PlusCircle, Store, PackageOpen, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import ItemCard from "@/components/items/ItemCard";
import { ShopItem, AndrewID, User } from "@/utils/types";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { ITEM_TYPE } from "@/utils/itemConstants";
import { hasPaymentPlatforms } from "@/utils/userConstants";
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
  const [user, setUser] = useState<User | null>(null);

  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const initializeComponent = async () => {
      setLoading(true);
      await Promise.all([refreshItems(), fetchUserData()]);
      setLoading(false);
    };

    initializeComponent();
  }, [andrewId]);

  useEffect(() => {
    console.log(user);
  }, [user]);

  const fetchUserData = async () => {
    try {
      const response = await fetch("/api/users/current", { method: "POST" });
      if (response.ok) {
        const userData: User = await response.json();
        setUser(userData);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  const handleCreateItem = () => {
    if (!user || !hasPaymentPlatforms(user)) {
      toast({
        title: "Payment Methods Required",
        description:
          "You must configure at least one payment method before creating items.",
        variant: "destructive",
      });
      return;
    }

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

  const CreateItemCard = () => {
    const canCreateItems = user && hasPaymentPlatforms(user);

    return (
      <Card
        className={`group flex h-[375px] flex-col items-center justify-center border-2 border-dashed p-6 transition-all ${
          canCreateItems
            ? "border-gray-300 bg-gray-50 hover:bg-gray-100 hover:border-gray-400 cursor-pointer"
            : "border-red-300 bg-red-50 cursor-not-allowed"
        }`}
        onClick={canCreateItems ? handleCreateItem : undefined}
      >
        <div className="flex flex-col items-center gap-4 text-center font-rubik">
          <div
            className={`rounded-full p-3 shadow-sm ${
              canCreateItems ? "bg-white group-hover:bg-blue-50" : "bg-red-100"
            }`}
          >
            {canCreateItems ? (
              <PlusCircle className="h-8 w-8 text-blue-500" />
            ) : (
              <AlertCircle className="h-8 w-8 text-red-500" />
            )}
          </div>
          <div>
            <h3
              className={`font-medium ${
                canCreateItems ? "text-gray-900" : "text-red-700"
              }`}
            >
              {canCreateItems ? (
                <>
                  Create New{" "}
                  {activeTab === "marketplace" ? "Marketplace" : "Commission"}{" "}
                  Item
                </>
              ) : (
                "Payment Methods Required"
              )}
            </h3>
            <p
              className={`mt-1 text-sm ${
                canCreateItems ? "text-gray-500" : "text-red-600"
              }`}
            >
              {canCreateItems
                ? activeTab === "marketplace"
                  ? "Add a new marketplace item to your shop"
                  : "Add a new commission item to your shop"
                : "Configure payment methods to create items"}
            </p>
          </div>
        </div>
      </Card>
    );
  };

  if (loading) {
    return <Loading />;
  }

  const renderContent = () => {
    const items =
      activeTab === "commission" ? commissionItems : marketplaceItems;
    const showPaymentAlert = user && !hasPaymentPlatforms(user);

    return (
      <div className="space-y-4">
        {/* Payment Methods Alert */}
        {showPaymentAlert && (
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              You need to configure at least one payment method before you can
              create items.{" "}
              <Button
                variant="link"
                className="p-0 h-auto text-red-600 underline"
                onClick={() => router.push("/account")}
              >
                Set up payment methods
              </Button>
            </AlertDescription>
          </Alert>
        )}

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
                : "border-transparent font-medium text-gray-400 hover:text-gray-500"
            }`}
          >
            Commissions
          </button>
          <button
            onClick={() => setActiveTab("marketplace")}
            className={`py-2 px-0 text-sm border-b-[3px] transition-colors ${
              activeTab === "marketplace"
                ? "border-blue-500 text-gray-900 font-medium"
                : "border-transparent font-medium text-gray-400 hover:text-gray-500"
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

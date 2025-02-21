"use client";
import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { PlusCircle, Store, PackageOpen, Edit, Trash2 } from "lucide-react";
import ItemCard from "@/components/items/itemcard/ItemCard";
import { getCommItemsBySeller } from "@/firebase/commItems";
import { getMPItemsBySeller } from "@/firebase/mpItems";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useToast } from "@/hooks/use-toast";
import { getUserByClerkId } from "@/firebase/users";
import { ITEM_TYPE } from "@/utils/constants";

// Interface for shop items (both marketplace and commission types)
interface ShopItem {
  id: string;
  type: "MARKETPLACE" | "COMMISSION";
  price: number;
  category: string;
  condition?: string;       
  turnaroundDays?: number;   
}

interface ShopContentProps {
  sellerId: string;           
}

export default function ShopContent({ sellerId }: ShopContentProps) {
  // State for managing component
  const [activeTab, setActiveTab] = useState<"marketplace" | "commission">("commission");
  const [commissionItems, setCommissionItems] = useState<ShopItem[]>([]);
  const [marketplaceItems, setMarketplaceItems] = useState<ShopItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  
  // Hooks
  const router = useRouter();
  const { user, isLoaded } = useUser();     
  const { toast } = useToast();             

  // Check if current user is the shop owner
  useEffect(() => {
    const checkOwnership = async () => {
      if (isLoaded && user) {
        try {
          // Get Firebase user document from Clerk ID
          const userData = await getUserByClerkId(user.id);
          // If IDs match, user is the shop owner
          if (userData && userData.id === sellerId) {
            setIsOwner(true);
          } else {
            setIsOwner(false);
          }
        } catch (error) {
          console.error("Error checking ownership:", error);
          setIsOwner(false);
        }
      } else {
        setIsOwner(false);
      }
    };

    checkOwnership();
  }, [isLoaded, user, sellerId]);

  // Load shop items when sellerId changes
  useEffect(() => {
    refreshItems();
  }, [sellerId]);

  // Navigate to item creation page
  const handleCreateItem = () => {
    router.push(`/item/create?type=${activeTab}`);
  };
  
  // Fetch and refresh both commission and marketplace items
  const refreshItems = async () => {
    if (!sellerId) return;
    
    setLoading(true);
    try {
      // Fetch both item types in parallel for efficiency
      const [commItems, mpItems] = await Promise.all([
        getCommItemsBySeller(sellerId),
        getMPItemsBySeller(sellerId)
      ]);

      // Map commission items to a consistent format
      setCommissionItems(commItems.map(item => ({
        id: item.id,
        type: ITEM_TYPE.COMMISSION,
        price: item.price,
        category: item.category,
        turnaroundDays: item.turnaroundDays
      })));

      // Map marketplace items to a consistent format
      setMarketplaceItems(mpItems.map(item => ({
        id: item.id,
        type: ITEM_TYPE.MARKETPLACE,
        price: item.price,
        category: item.category,
        condition: item.condition
      })));
    } catch (error) {
      console.error("Error refreshing items:", error);
      toast({
        title: "Error",
        description: "Failed to refresh items",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
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
              {isOwner 
                ? type === "marketplace"
                  ? "Create your first marketplace listing by clicking the '+' button."
                  : "Create your first commission offering by clicking the '+' button."
                : type === "marketplace"
                ? "This creator hasn't added any marketplace items yet."
                : "This creator hasn't added any commissions items yet."
              }
            </p>
          </div>
        </div>
      </Card>
    </div>
  );

  const CreateItemCard = () => (
    <Card 
      className="group flex h-[280px] flex-col items-center justify-center border-2 border-dashed border-gray-300 bg-gray-50 p-6 hover:bg-gray-100 hover:border-gray-400 cursor-pointer transition-all"
      onClick={handleCreateItem}
    >
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="rounded-full bg-white p-3 shadow-sm group-hover:bg-blue-50">
          <PlusCircle className="h-8 w-8 text-blue-500" />
        </div>
        <div>
          <h3 className="font-medium text-gray-900">
            Create New {activeTab === "marketplace" ? "Marketplace" : "Commission"} Item
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
    return (
      <div className="mx-auto max-w-7xl py-8 px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 py-4">

          {[...Array(4)].map((_, i) => (
            <Card key={i} className="w-full h-[280px] animate-pulse bg-gray-100" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl py-4">
      {/* Tabs for switching between commission and marketplace items */}
      <Tabs
        defaultValue="commission"
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as "marketplace" | "commission")}
        className="space-y-0"
      >
        <div className="relative after:absolute after:bottom-0 after:left-0 after:right-0 after:h-px after:bg-gray-200">

          <TabsList className="relative z-10 w-full justify-start bg-transparent p-0">
            <TabsTrigger
              value="commission"
              className="relative shadow-sm border-x-2 border-t-2 border-gray-200 px-2 pb-3 pt-2 text-gray-500 transition-all duration-200 data-[state=active]:border-gray-200 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-[0_1px_0_0_white] [&:not([data-state=active])]:rounded-t-lg"
            >
              <span className="flex items-center gap-2 px-1 text-sm font-medium">
                Commissions
                <span className="text-xs font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                  {commissionItems.length}
                </span>
              </span>
            </TabsTrigger>

            <TabsTrigger
              value="marketplace"
              className="relative shadow-sm border-x-2 border-t-2 border-gray-200 px-2 pb-3 pt-2 text-gray-500 transition-all duration-200 data-[state=active]:border-gray-200 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-[0_1px_0_0_white] [&:not([data-state=active])]:rounded-t-lg"
            >
              <span className="flex items-center gap-2 px-1 text-sm font-medium">
                Marketplace
                <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
                  {marketplaceItems.length}
                </span>
              </span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Content container for both tabs */}
        <div className="rounded-b-xl border-2 border-gray-200 bg-white px-6 shadow-lg">
          <div className="flex gap-2">
            <div className="flex-1 py-6">
              {/* Marketplace tab content */}
              <TabsContent value="marketplace" className="mt-0 focus-visible:outline-none">

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {/* Create button only appears for shop owner */}
                  {isOwner && <CreateItemCard />}
                  
                  {marketplaceItems.length > 0 ? (

                    marketplaceItems.map((item) => (
                      <div key={item.id} className="flex justify-center">
                        <ItemCard
                          itemId={item.id}
                          type={ITEM_TYPE.MARKETPLACE}
                          isDashboard={isOwner}
                          onItemDeleted={refreshItems}
                        />
                      </div>
                    ))
                  ) : (
                    // Show empty state if no items
                    <EmptyState type="marketplace" />
                  )}
                </div>
              </TabsContent>

              {/* Commission tab content */}
              <TabsContent value="commission" className="mt-0 focus-visible:outline-none">

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {/* Create button only appears for shop owner */}
                  {isOwner && <CreateItemCard />}
                  
                  {commissionItems.length > 0 ? (
                    commissionItems.map((item) => (
                      <div key={item.id} className="flex justify-center">
                        <ItemCard
                          itemId={item.id}
                          type={ITEM_TYPE.COMMISSION}
                          isDashboard={isOwner}
                          onItemDeleted={refreshItems}
                        />
                      </div>
                    ))
                  ) : (
                    // Show empty state if no items
                    <EmptyState type="commission" />
                  )}
                </div>
              </TabsContent>
            </div>
          </div>
        </div>
      </Tabs>
    </div>
  );
}
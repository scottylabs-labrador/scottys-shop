import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Store, PackageOpen } from "lucide-react";
import ItemCard from "@/components/items/ItemCard";
import { getCommItemsBySeller } from "@/firebase/commItems";
import { getMPItemsBySeller } from "@/firebase/mpItems";

interface ShopItem {
  _id: string;
  type: "commission" | "marketplace";
  price: number;
  category: string;
  condition?: string;
  turnaroundDays?: number;
}

export default function ContentSection({
  sellerId,
}: {
  sellerId: string;
}) {
  const [activeTab, setActiveTab] = useState<"marketplace" | "commission">("commission");
  const [commissionItems, setCommissionItems] = useState<ShopItem[]>([]);
  const [marketplaceItems, setMarketplaceItems] = useState<ShopItem[]>([]);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const [commItems, mpItems] = await Promise.all([
          getCommItemsBySeller(sellerId),
          getMPItemsBySeller(sellerId)
        ]);

        setCommissionItems(commItems.map(item => ({
          _id: item.id,
          type: "commission",
          price: item.price,
          category: item.category,
          turnaroundDays: item.turnaroundDays
        })));

        setMarketplaceItems(mpItems.map(item => ({
          _id: item.id,
          type: "marketplace",
          price: item.price,
          category: item.category,
          condition: item.condition
        })));
      } catch (error) {
        console.error("Error fetching items:", error);
      }
    };

    fetchItems();
  }, [sellerId]);

  const EmptyState = ({ type }: { type: "marketplace" | "commission" }) => (
    <div className="col-span-full flex items-center justify-center">
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
              {type === "marketplace"
                ? "Start selling your creations by adding items to your marketplace."
                : "Open commission slots to start accepting custom work requests."}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl">
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

        <div className="rounded-b-xl border-2 border-gray-200 bg-white px-6 shadow-lg">
          <div className="flex gap-2">
            <div className="flex-1 py-6">
              <TabsContent value="marketplace" className="mt-0 focus-visible:outline-none">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                  {marketplaceItems.length > 0 ? (
                    marketplaceItems.map((item) => (
                      <ItemCard
                        key={item._id}
                        itemId={item._id}
                        type="MARKETPLACE"
                      />
                    ))
                  ) : (
                    <EmptyState type="marketplace" />
                  )}
                </div>
              </TabsContent>

              <TabsContent value="commission" className="mt-0 focus-visible:outline-none">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                  {commissionItems.length > 0 ? (
                    commissionItems.map((item) => (
                      <ItemCard
                        key={item._id}
                        itemId={item._id}
                        type="COMMISSION"
                      />
                    ))
                  ) : (
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
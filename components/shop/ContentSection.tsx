import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Store, PackageOpen } from "lucide-react";
import ItemCard from "@/components/ItemCard";
import { ItemFilter } from "@/components/ItemFilter";
import { ITEM_TYPE } from "@/convex/constants";
import { Id } from "@/convex/_generated/dataModel";

interface ShopItem {
  _id: Id<"commItems"> | Id<"mpItems">;
  type: typeof ITEM_TYPE.COMMISSION | typeof ITEM_TYPE.MARKETPLACE;
}

interface FilterState {
  minPrice?: number;
  maxPrice?: number;
  category?: string;
  condition?: string;
  maxTurnaroundDays?: number;
}

interface ShopItems {
  commissionItems: Array<{ _id: Id<"commItems"> }>;
  marketplaceItems: Array<{ _id: Id<"mpItems"> }>;
}

interface ContentSectionProps {
  shopItems: ShopItems;
  isOwnShop: boolean;
}

export default function ContentSection({
  shopItems,
  isOwnShop,
}: ContentSectionProps) {
  const [activeTab, setActiveTab] = useState<"marketplace" | "commission">(
    "commission"
  );
  const [filters, setFilters] = useState<FilterState>({});

  const { commissionItems, marketplaceItems } = shopItems;

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
  };

  const filterItems = (items: any[], isMarketplace: boolean) => {
    return items.filter((item) => {
      let matches = true;

      if (filters.minPrice && item.price < filters.minPrice) matches = false;
      if (filters.maxPrice && item.price > filters.maxPrice) matches = false;
      if (filters.category && item.category !== filters.category)
        matches = false;

      if (isMarketplace) {
        if (filters.condition && item.condition !== filters.condition)
          matches = false;
      } else {
        if (
          filters.maxTurnaroundDays &&
          item.turnaroundDays > filters.maxTurnaroundDays
        )
          matches = false;
      }

      return matches;
    });
  };

  const EmptyState = ({ type }: { type: "marketplace" | "commission" }) => (
    <div className="col-span-full flex items-center justify-center">
      <Card className="w-full max-w-lg bg-white shadow-sm">
        <div className="flex flex-col items-center gap-6 p-10">
          <div className="rounded-full bg-gray-50 p-4 ring-1 ring-gray-100">
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
        onValueChange={(value) =>
          setActiveTab(value as "marketplace" | "commission")
        }
        className="space-y-0"
      >
        <div className="relative after:absolute after:bottom-0 after:left-0 after:right-0 after:h-px after:bg-gray-200">
          <TabsList className="relative z-10 w-full justify-start bg-transparent p-0">
            <TabsTrigger
              value="commission"
              className="relative shadow-sm border-x-2 border-t-2 border-gray-200 px-[10px] pb-3 pt-2 text-gray-500 transition-all duration-200 data-[state=active]:border-gray-200 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-[0_1px_0_0_white] [&:not([data-state=active])]:rounded-t-lg"
            >
              <span className="flex items-center gap-2 px-1 text-sm font-rubik font-lg">
                Commissions
                <span className="text-xs font-semibold text-green-700 bg-green-50 pl-1 rounded-full shadow-sm">
                  {commissionItems.length}
                </span>
              </span>
            </TabsTrigger>

            <TabsTrigger
              value="marketplace"
              className="relative shadow-sm border-x-2 border-t-2 border-gray-200 px-[10px] pb-3 pt-2 text-gray-500 transition-all duration-200 data-[state=active]:border-gray-200 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-[0_1px_0_0_white] [&:not([data-state=active])]:rounded-t-lg"
            >
              <span className="flex items-center gap-2 px-1 text-sm font-rubik font-lg">
                Marketplace
                <span className="text-xs font-semibold text-blue-700 bg-green-50 pl-1 rounded-full shadow-sm">
                  {marketplaceItems.length}
                </span>
              </span>
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="rounded-b-xl border-2 shadow-lg border-gray-200 bg-white px-6">
          <div className="flex gap-10">
            <aside className="w-64 flex-none">
              <div className="rounded-lg bg-white">
                <ItemFilter
                  onFilterChange={handleFilterChange}
                  isMarketplace={activeTab === "marketplace"}
                  initialFilters={filters}
                />
              </div>
            </aside>

            <div className="flex-1 py-6">
              <TabsContent
                value="marketplace"
                className="mt-0 focus-visible:outline-none"
              >
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                  {marketplaceItems.length > 0 ? (
                    filterItems(marketplaceItems, true).map((item) => (
                      <ItemCard
                        key={item._id}
                        itemId={item._id}
                        type={ITEM_TYPE.MARKETPLACE}
                      />
                    ))
                  ) : (
                    <EmptyState type="marketplace" />
                  )}
                </div>
              </TabsContent>

              <TabsContent
                value="commission"
                className="mt-0 focus-visible:outline-none"
              >
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                  {commissionItems.length > 0 ? (
                    filterItems(commissionItems, false).map((item) => (
                      <ItemCard
                        key={item._id}
                        itemId={item._id}
                        type={ITEM_TYPE.COMMISSION}
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

/**
 * Component for displaying shop items
 * Provides item grid view with optional editing controls
 */
"use client";
import React, { useState, useEffect, use } from "react";
import { Card } from "@/components/ui/card";
import { Store, Pencil } from "lucide-react";
import ItemCard from "@/components/items/ItemCard";
import { useToast } from "@/hooks/use-toast";
import Loading from "@/components/utils/Loading";
import { AndrewID } from "@/utils/types";

interface ShopItem {
  id: string;
  type: "MARKETPLACE" | "COMMISSION";
  price: number;
  category: string;
  condition?: string;
}

interface ShopDisplayProps {
  andrewId: AndrewID;
  isOwnShop?: boolean;
  isDashboard?: boolean;
  isEditing?: boolean;
  handleEditClick?: (e: React.MouseEvent) => void;
}

export default function ShopDisplay({
  andrewId,
  isOwnShop = false,
  isDashboard = false,
  isEditing = false,
  handleEditClick,
}: ShopDisplayProps) {
  const [allItems, setAllItems] = useState<ShopItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchItems();
  }, [andrewId]);

  const fetchItems = async () => {
    if (!andrewId) return;

    setLoading(true);
    try {
      const [commResponse, mpResponse] = await Promise.all([
        fetch(`/api/users/${andrewId}/items/commission`),
        fetch(`/api/users/${andrewId}/items/marketplace`),
      ]);

      const commItems = commResponse.ok ? await commResponse.json() : [];
      const mpItems = mpResponse.ok ? await mpResponse.json() : [];

      console.log("Fetched Commission Items:", commItems);
      console.log("Fetched Marketplace Items:", mpItems);

      const formattedCommItems = commItems.map((item: any) => ({
        id: item.id,
        type: "COMMISSION" as const,
        price: item.price,
        category: item.category,
      }));

      const formattedMpItems = mpItems.map((item: any) => ({
        id: item.id,
        type: "MARKETPLACE" as const,
        price: item.price,
        category: item.category,
        condition: item.condition,
      }));

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
          </div>
        )}
      </div>

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
    </div>
  );
}

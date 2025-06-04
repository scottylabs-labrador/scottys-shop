"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import ItemCard from "@/components/items/ItemCard";
import { ItemFilter } from "@/components/items/ItemFilter";
import Loading from "@/components/utils/Loading";
import { ITEM_TYPE, ITEM_STATUS } from "@/utils/itemConstants";
import {
  getMPItemsByStatus,
  getMPItemsByCategory,
  getMPItemsByPriceRange,
  type MPItemWithId,
} from "@/firebase/mpItems";
import { User } from "@/utils/types";

interface FilterState {
  minPrice?: number;
  maxPrice?: number;
  category?: string;
  condition?: string;
}

export default function MarketplacePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const [items, setItems] = useState<MPItemWithId[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [userLoading, setUserLoading] = useState(true);

  const [filters, setFilters] = useState<FilterState>(() => ({
    minPrice: searchParams.get("minPrice")
      ? Number(searchParams.get("minPrice"))
      : undefined,
    maxPrice: searchParams.get("maxPrice")
      ? Number(searchParams.get("maxPrice"))
      : undefined,
    category: searchParams.get("category") || undefined,
    condition: searchParams.get("condition") || undefined,
  }));

  // Fetch current user data
  useEffect(() => {
    const fetchCurrentUser = async () => {
      if (!user?.id) {
        setUserLoading(false);
        return;
      }

      try {
        const response = await fetch("/api/users/current", { method: "POST" });
        if (response.ok) {
          const userData: User = await response.json();
          setCurrentUser(userData);
        }
      } catch (error) {
        console.error("Error fetching current user:", error);
      } finally {
        setUserLoading(false);
      }
    };

    if (isLoaded) {
      fetchCurrentUser();
    }
  }, [user?.id, isLoaded]);

  useEffect(() => {
    console.log("Current user state updated:", currentUser);
  }, [currentUser]);

  useEffect(() => {
    const fetchItems = async () => {
      setLoading(true);
      try {
        let filteredItems: MPItemWithId[] = [];

        if (filters.category) {
          filteredItems = await getMPItemsByCategory(filters.category);
        } else if (
          filters.minPrice !== undefined &&
          filters.maxPrice !== undefined
        ) {
          filteredItems = await getMPItemsByPriceRange(
            filters.minPrice,
            filters.maxPrice
          );
        } else {
          filteredItems = await getMPItemsByStatus(ITEM_STATUS.AVAILABLE);
        }

        filteredItems = filteredItems.filter((item) => {
          let matches = true;

          if (filters.minPrice !== undefined) {
            matches = matches && item.price >= filters.minPrice;
          }
          if (filters.maxPrice !== undefined) {
            matches = matches && item.price <= filters.maxPrice;
          }
          if (filters.condition) {
            matches = matches && item.condition === filters.condition;
          }

          matches = matches && item.status === ITEM_STATUS.AVAILABLE;
          return matches;
        });

        setItems(filteredItems);
      } catch (error) {
        console.error("Error fetching items:", error);
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, [filters.minPrice, filters.maxPrice, filters.category, filters.condition]);

  const handleFilterChange = (newFilters: FilterState) => {
    const params = new URLSearchParams();

    if (newFilters.minPrice)
      params.set("minPrice", newFilters.minPrice.toString());
    if (newFilters.maxPrice)
      params.set("maxPrice", newFilters.maxPrice.toString());
    if (newFilters.category) params.set("category", newFilters.category);
    if (newFilters.condition) params.set("condition", newFilters.condition);

    router.push(params.toString() ? `?${params.toString()}` : "");
    setFilters(newFilters);
  };

  // Wait for both items and user data to load
  if (loading || userLoading || !isLoaded) return <Loading />;

  return (
    <div className="flex flex-col max-w-8xl mx-auto px-[125px] py-6">
      <div className="mb-6">
        <ItemFilter
          onFilterChange={handleFilterChange}
          isMarketplace
          initialFilters={filters}
        />
      </div>
      <div className="flex-1">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {items.map((item) => (
            <ItemCard
              key={item.id}
              itemId={item.id}
              type={ITEM_TYPE.MARKETPLACE}
              itemData={item}
              currentUser={currentUser}
            />
          ))}
          {items.length === 0 && (
            <div className="col-span-full text-center py-10 text-muted-foreground">
              No items found
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

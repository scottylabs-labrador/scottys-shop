"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import ItemCard from "@/components/items/ItemCard";
import { ItemFilter } from "@/components/items/ItemFilter";
import Loading from "@/components/utils/Loading";
import { ITEM_TYPE } from "@/utils/itemConstants";
import {
  getAvailableCommItems,
  getCommItemsByCategory,
  getCommItemsByPriceRange,
  type CommItemWithId,
} from "@/firebase/commItems";
import { User } from "@/utils/types";

interface FilterState {
  minPrice?: number;
  maxPrice?: number;
  category?: string;
  condition?: string;
}

export default function CommissionsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, isLoaded } = useUser(); // Add isLoaded here
  const [items, setItems] = useState<CommItemWithId[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [userLoading, setUserLoading] = useState(true); // Add separate user loading state

  const [filters, setFilters] = useState<FilterState>(() => {
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const category = searchParams.get("category");

    return {
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      category: category || undefined,
    };
  });

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
    const fetchItems = async () => {
      setLoading(true);
      try {
        let filteredItems: CommItemWithId[] = [];

        if (filters.category) {
          filteredItems = await getCommItemsByCategory(filters.category);
        } else if (
          filters.minPrice !== undefined &&
          filters.maxPrice !== undefined
        ) {
          filteredItems = await getCommItemsByPriceRange(
            filters.minPrice,
            filters.maxPrice
          );
        } else {
          filteredItems = await getAvailableCommItems();
        }

        filteredItems = filteredItems.filter((item) => {
          let matches = true;

          if (filters.minPrice !== undefined) {
            matches = matches && item.price >= filters.minPrice;
          }
          if (filters.maxPrice !== undefined) {
            matches = matches && item.price <= filters.maxPrice;
          }
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
  }, [filters.minPrice, filters.maxPrice, filters.category]);

  const handleFilterChange = (newFilters: FilterState) => {
    const params = new URLSearchParams();

    if (newFilters.minPrice)
      params.set("minPrice", newFilters.minPrice.toString());
    if (newFilters.maxPrice)
      params.set("maxPrice", newFilters.maxPrice.toString());
    if (newFilters.category) params.set("category", newFilters.category);

    const newUrl = params.toString() ? `?${params.toString()}` : "";
    router.push(newUrl);
    setFilters(newFilters);
  };

  // Wait for both items and user data to load
  if (loading || userLoading || !isLoaded) return <Loading />;

  return (
    <div className="flex flex-col max-w-8xl mx-auto px-[125px] py-6">
      <div className="mb-6">
        <ItemFilter
          onFilterChange={handleFilterChange}
          isMarketplace={false}
          initialFilters={filters}
        />
      </div>
      <div className="flex-1">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {items.map((item) => (
            <ItemCard
              key={item.id}
              itemId={item.id}
              type={ITEM_TYPE.COMMISSION}
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

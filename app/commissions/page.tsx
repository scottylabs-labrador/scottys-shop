"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import ItemCard from "@/components/items/itemcard/ItemCard";
import { ItemFilter } from "@/components/items/ItemFilter";
import Loading from "@/components/utils/Loading";
import { ITEM_TYPE } from "@/utils/ItemConstants";
import {
  getAvailableCommItems,
  getCommItemsByCategory,
  getCommItemsByPriceRange,
  getCommItemsByTurnaroundTime,
  type CommItemWithId,
} from "@/firebase/commItems";

interface FilterState {
  minPrice?: number;
  maxPrice?: number;
  category?: string;
  condition?: string;
  maxTurnaroundDays?: number;
}

export default function CommissionsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [items, setItems] = useState<CommItemWithId[]>([]);
  const [loading, setLoading] = useState(true);

  // Initialize filters from URL parameters
  const [filters, setFilters] = useState<FilterState>(() => {
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const category = searchParams.get("category");
    const maxTurnaroundDays = searchParams.get("maxTurnaroundDays");

    return {
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      category: category || undefined,
      maxTurnaroundDays: maxTurnaroundDays
        ? Number(maxTurnaroundDays)
        : undefined,
    };
  });

  // Fetch items based on current filters
  useEffect(() => {
    const fetchItems = async () => {
      setLoading(true);
      try {
        let filteredItems: CommItemWithId[] = [];

        // Apply filters in order of specificity
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
        } else if (filters.maxTurnaroundDays) {
          filteredItems = await getCommItemsByTurnaroundTime(
            filters.maxTurnaroundDays
          );
        } else {
          // No filters, get all available items
          filteredItems = await getAvailableCommItems();
        }

        // Apply remaining filters in memory
        filteredItems = filteredItems.filter((item) => {
          let matches = true;

          if (filters.minPrice !== undefined) {
            matches = matches && item.price >= filters.minPrice;
          }
          if (filters.maxPrice !== undefined) {
            matches = matches && item.price <= filters.maxPrice;
          }
          if (filters.maxTurnaroundDays !== undefined) {
            matches =
              matches && item.turnaroundDays <= filters.maxTurnaroundDays;
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
  }, [filters]);

  // Update URL when filters change
  const handleFilterChange = (newFilters: FilterState) => {
    const params = new URLSearchParams();

    if (newFilters.minPrice)
      params.set("minPrice", newFilters.minPrice.toString());
    if (newFilters.maxPrice)
      params.set("maxPrice", newFilters.maxPrice.toString());
    if (newFilters.category) params.set("category", newFilters.category);
    if (newFilters.maxTurnaroundDays) {
      params.set("maxTurnaroundDays", newFilters.maxTurnaroundDays.toString());
    }

    const newUrl = params.toString() ? `?${params.toString()}` : "";
    router.push(newUrl);
    setFilters(newFilters);
  };

  if (loading) return <Loading />;

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

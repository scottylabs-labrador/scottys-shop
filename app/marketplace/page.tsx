"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import ItemCard from "@/components/items/itemcard/ItemCard";
import { ItemFilter } from "@/components/items/ItemFilter";
import Loading from "@/components/utils/Loading";
import { ITEM_TYPE, MPITEM_STATUS } from "@/utils/ItemConstants";
import {
  getMPItemsByStatus,
  getMPItemsByCategory,
  getMPItemsByPriceRange,
  type MPItemWithId,
} from "@/firebase/mpItems";

interface FilterState {
  minPrice?: number;
  maxPrice?: number;
  category?: string;
  condition?: string;
}

export default function MarketplacePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [items, setItems] = useState<MPItemWithId[]>([]);
  const [loading, setLoading] = useState(true);

  // Initialize filters from URL parameters
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

  // Fetch items based on current filters
  useEffect(() => {
    const fetchItems = async () => {
      setLoading(true);
      try {
        let filteredItems: MPItemWithId[] = [];

        // Apply filters in order of specificity
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
          // No filters, get all available items
          filteredItems = await getMPItemsByStatus(MPITEM_STATUS.AVAILABLE);
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
          if (filters.condition) {
            matches = matches && item.condition === filters.condition;
          }

          // Ensure we only show available items
          matches = matches && item.status === MPITEM_STATUS.AVAILABLE;

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
    if (newFilters.condition) params.set("condition", newFilters.condition);

    router.push(params.toString() ? `?${params.toString()}` : "");
    setFilters(newFilters);
  };

  if (loading) return <Loading />;

  return (
    <div className="flex flex-col max-w-7xl mx-auto px-4 py-6">
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

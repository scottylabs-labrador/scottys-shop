"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { useSearchParams, useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import ItemCard from "@/components/ItemCard";
import { ItemFilter } from "@/components/ItemFilter";
import Loading from "@/components/Loading";
import { ITEM_TYPE } from "@/convex/constants";

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

  const items = useQuery(api.commItems.search, filters);

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

  if (!items) return <Loading />;

  return (
    <div className="flex flex-col max-w-7xl mx-auto px-4 py-6">
      <div className="pl-5">
        <ItemFilter
          onFilterChange={handleFilterChange}
          isMarketplace
          initialFilters={filters}
        />
      </div>
      <div className="flex-1 pl-9">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {items.map((item) => (
            <ItemCard
              key={item._id}
              itemId={item._id}
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

"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import ItemCard from "@/components/ItemCard";
import { ItemFilter } from "@/components/ItemFilter";
import Loading from "@/components/Loading";
import { ITEM_TYPE } from "@/convex/constants";

export default function CommissionsPage() {
  const [filters, setFilters] = useState({});
  const items = useQuery(api.commItems.search, filters);

  if (!items) return <Loading />;

  return (
    <div className="flex flex-col md:flex-row">
      <ItemFilter onFilterChange={setFilters} />

      <main className="flex-1 p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
      </main>
    </div>
  );
}

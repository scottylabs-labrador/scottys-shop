"use client";

import Loading from "@/components/Loading";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import ItemCard from "./ItemCard";

function ItemGrid() {
  const mpItems = useQuery(api.mpItems.search, {
    status: "available",
  });

  const commItems = useQuery(api.commItems.search, {
    isAvailable: true,
  });

  // Show loading state if either query is still loading
  if (!mpItems || !commItems) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Marketplace Items Section */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Marketplace Items</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {mpItems.map((item) => (
            <ItemCard key={item._id} itemId={item._id} type="marketplace" />
          ))}
          {/* No Items Message */}
          {mpItems.length === 0 && (
            <div className="text-center py-12">
              <p className="text-lg text-muted-foreground">
                No marketplace items available at the moment.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Commission Items Section */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Commission Items</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {commItems.map((item) => (
            <ItemCard key={item._id} itemId={item._id} type="commission" />
          ))}
          {/* No Items Message */}
          {commItems.length === 0 && (
            <div className="text-center py-12">
              <p className="text-lg text-muted-foreground">
                No commissions items available at the moment.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default ItemGrid;

"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { ITEM_TYPE } from "@/convex/constants";
import ItemCard from "@/components/ItemCard";
import Loading from "@/components/Loading";

export default function FavoritesPage() {
  const { user, isLoaded } = useUser();
  const userId = user?.id;

  const favorites = useQuery(
    api.users.getUserFavorites,
    userId ? { userId } : "skip"
  );

  // Show loading state while user auth is being checked
  if (!isLoaded) return <Loading />;

  // Show loading state while favorites are being fetched
  if (favorites === undefined) return <Loading />;

  return (
    <div className="container max-w-8xl mx-auto px-[100px] py-6">
      <h1 className="text-5xl font-caladea mb-6 border-b-4 border-[#C41230] pb-2">
        Favorites
      </h1>

      {/* Grid layout for favorite items */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {favorites?.map((item) => (
          <ItemCard
            key={item._id}
            itemId={item._id as Id<"commItems"> | Id<"mpItems">}
            type={
              item.type === "commission"
                ? ITEM_TYPE.COMMISSION
                : ITEM_TYPE.MARKETPLACE
            }
          />
        ))}

        {/* Empty state */}
        {favorites.length === 0 && (
          <div className="col-span-full text-center py-10 text-gray-500">
            No favorite items yet
          </div>
        )}
      </div>
    </div>
  );
}

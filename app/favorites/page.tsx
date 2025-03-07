"use client";

import { useState, useEffect } from "react";
import { SignIn, useUser } from "@clerk/nextjs";
import { ITEM_TYPE } from "@/utils/ItemConstants";
import ItemCard from "@/components/items/itemcard/ItemCard";
import Loading from "@/components/utils/Loading";
import { getUserByClerkId } from "@/firebase/users";
import { getCommItemById } from "@/firebase/commItems";
import { getMPItemById } from "@/firebase/mpItems";

interface FavoriteItem {
  id: string;
  type: (typeof ITEM_TYPE)[keyof typeof ITEM_TYPE];
}

export default function FavoritesPage() {
  const { user, isLoaded } = useUser();
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFavorites = async () => {
      if (!user?.id) return;

      try {
        // Get user data from Firebase
        const userData = await getUserByClerkId(user.id);
        if (!userData) return;

        // Process favorite IDs
        const favoritePromises = userData.favorites.map(async (favoriteId) => {
          // Favorite IDs are stored with prefix: 'comm_' or 'mp_'
          const [type, id] = favoriteId.split("_");

          try {
            // Verify item exists
            const item =
              type === "comm"
                ? await getCommItemById(id)
                : await getMPItemById(id);

            if (item) {
              return {
                id,
                type:
                  type === "comm"
                    ? ITEM_TYPE.COMMISSION
                    : ITEM_TYPE.MARKETPLACE,
              };
            }
          } catch (error) {
            console.error(`Error fetching item ${favoriteId}:`, error);
          }
          return null;
        });

        // Wait for all promises to resolve and filter out null values
        const resolvedFavorites = (await Promise.all(favoritePromises)).filter(
          (item): item is FavoriteItem => item !== null
        );

        setFavorites(resolvedFavorites);
      } catch (error) {
        console.error("Error fetching favorites:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (isLoaded) {
      fetchFavorites();
    }
  }, [user?.id, isLoaded]);

  // Show Sign In if user is not authenticated
  if (!user && isLoaded) {
    return (
      <div className="flex justify-center items-center h-[80vh]">
        <SignIn />
      </div>
    );
  }

  // Show loading state while user auth is being checked
  if (!isLoaded || isLoading) return <Loading />;

  return (
    <div className="container max-w-8xl mx-auto px-[100px] py-6">
      <h1 className="text-5xl font-caladea mb-6 border-b-4 border-[#C41230] pb-2">
        Favorites
      </h1>

      {/* Grid layout for favorite items */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {favorites.map((item) => (
          <ItemCard
            key={`${item.type}_${item.id}`}
            itemId={item.id}
            type={item.type}
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

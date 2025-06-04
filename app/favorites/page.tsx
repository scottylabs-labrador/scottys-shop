"use client";
import { useState, useEffect } from "react";
import { SignIn, useUser } from "@clerk/nextjs";
import { ITEM_TYPE } from "@/utils/itemConstants";
import ItemCard from "@/components/items/ItemCard";
import Loading from "@/components/utils/Loading";
import { User } from "@/utils/types";

interface FavoriteItem {
  id: string;
  type: (typeof ITEM_TYPE)[keyof typeof ITEM_TYPE];
  itemData?: any;
}

export default function FavoritesPage() {
  const { user, isLoaded } = useUser();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch current user data
  useEffect(() => {
    const fetchCurrentUser = async () => {
      if (!user?.id) return;

      try {
        const response = await fetch("/api/users/current", { method: "POST" });
        if (response.ok) {
          const userData: User = await response.json();

          setCurrentUser(userData);
        }
      } catch (error) {
        console.error("Error fetching current user:", error);
      }
    };

    if (isLoaded) {
      fetchCurrentUser();
    }
  }, [user?.id, isLoaded]);

  // Process favorites and fetch item data
  useEffect(() => {
    const processFavorites = async () => {
      if (!currentUser?.favorites) {
        setIsLoading(false);
        return;
      }

      try {
        const favoritePromises = currentUser.favorites.map(
          async (favoriteId) => {
            const [type, id] = favoriteId.split("_");

            try {
              const itemType = type === "comm" ? "commission" : "marketplace";
              const response = await fetch(`/api/items/${itemType}/${id}`);

              if (response.ok) {
                const itemData = await response.json();
                return {
                  id,
                  type:
                    type === "comm"
                      ? ITEM_TYPE.COMMISSION
                      : ITEM_TYPE.MARKETPLACE,
                  itemData,
                };
              }
            } catch (error) {
              console.error(`Error fetching item ${favoriteId}:`, error);
            }
            return null;
          }
        );

        const resolvedFavorites = (await Promise.all(favoritePromises)).filter(
          (item): item is FavoriteItem & { itemData: any } =>
            item !== null && item.itemData
        );

        setFavorites(resolvedFavorites);
      } catch (error) {
        console.error("Error processing favorites:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (currentUser) {
      processFavorites();
    }
  }, [currentUser]);

  if (!user && isLoaded) {
    return (
      <div className="flex justify-center items-center h-[80vh]">
        <SignIn />
      </div>
    );
  }

  if (!isLoaded || isLoading) return <Loading />;

  return (
    <div className="max-w-8xl mx-auto px-[125px] py-6">
      <h1 className="text-5xl font-caladea mb-6 border-b-4 border-[#C41230] pb-2">
        Favorites
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-6">
        {favorites.map((item) => (
          <ItemCard
            key={`${item.type}_${item.id}`}
            itemId={item.id}
            type={item.type}
            itemData={item.itemData}
            currentUser={currentUser}
          />
        ))}

        {favorites.length === 0 && (
          <div className="col-span-full text-center py-10 text-gray-500">
            No favorite items yet
          </div>
        )}
      </div>
    </div>
  );
}

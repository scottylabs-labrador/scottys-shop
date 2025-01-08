"use client";

import React, { useEffect } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ITEM_TYPE } from "@/convex/constants";
import Loading from "@/components/Loading";
import ItemCard from "@/components/ItemCard";

export default function ShopPage() {
  // URL parameters
  const params = useParams();
  const andrewId = typeof params?.andrewId === "string" ? params.andrewId : "";

  // Queries
  const shopOwner = useQuery(api.users.getUserByAndrewId, { andrewId });
  const shopItems = useQuery(api.users.getShopItems, {
    userId: shopOwner?._id ?? ("" as Id<"users">),
  });

  // Mutations
  const getFileUrl = useMutation(api.files.getUrl);

  // State management
  const [avatarUrl, setAvatarUrl] = React.useState<string | null>(null);
  const [bannerUrl, setBannerUrl] = React.useState<string | null>(null);

  // Effect for avatar URL
  useEffect(() => {
    const fetchAvatarUrl = async () => {
      if (shopOwner?.avatarUrl && shopOwner?.clerkId) {
        try {
          if (shopOwner.avatarUrl.startsWith("http")) {
            setAvatarUrl(shopOwner.avatarUrl);
          } else {
            const url = await getFileUrl({
              storageId: shopOwner.avatarUrl,
              userId: shopOwner?.clerkId,
            });
            setAvatarUrl(url);
          }
        } catch (error) {
          console.error("Error fetching avatar URL:", error);
        }
      }
    };

    fetchAvatarUrl();
  }, [shopOwner?.avatarUrl, shopOwner?.clerkId, getFileUrl]);

  // Effect for banner URL
  useEffect(() => {
    const fetchBannerUrl = async () => {
      if (shopOwner?.shopBanner && shopOwner?.clerkId) {
        try {
          if (shopOwner.shopBanner.startsWith("http")) {
            setBannerUrl(shopOwner.shopBanner);
          } else {
            const url = await getFileUrl({
              storageId: shopOwner.shopBanner,
              userId: shopOwner.clerkId,
            });
            setBannerUrl(url);
          }
        } catch (error) {
          console.error("Error fetching banner URL:", error);
        }
      }
    };

    fetchBannerUrl();
  }, [shopOwner?.shopBanner, shopOwner?.clerkId, getFileUrl]);

  // Loading check
  if (!shopOwner || !shopItems) return <Loading />;

  return (
    <div className="bg-gray-50">
      {/* Banner Section */}
      <div className="relative h-64 bg-gray-200">
        <div
          className="h-full w-full bg-cover bg-center"
          style={{
            backgroundImage: `url(${bannerUrl || "/assets/default-banner.png"})`,
          }}
        />
      </div>

      <div className="max-w-full mx-auto px-4">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Profile Section */}
          <div className="w-full md:w-64 flex-shrink-0">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="w-32 h-32 mx-auto">
                <Avatar className="w-full h-full">
                  <AvatarImage
                    src={avatarUrl || "/assets/default-avatar.png"}
                  />
                  <AvatarFallback>{shopOwner.name[0]}</AvatarFallback>
                </Avatar>
              </div>
              <h2 className="text-xl font-bold text-center mt-4">
                {shopOwner.andrewId}
              </h2>
            </div>
          </div>

          {/* Content Section */}
          <div className="flex-1 bg-white rounded-lg shadow-sm p-6">
            <div className="mb-8">
              <h3 className="text-2xl font-semibold mb-4">
                {shopOwner.shopTitle ||
                  `Welcome to ${shopOwner.name.split(" ")[0]}'s Shop`}
              </h3>

              {shopOwner.shopDescription && (
                <p className="text-gray-600 text-md leading-relaxed">
                  {shopOwner.shopDescription}
                </p>
              )}
            </div>

            {/* Commission Items */}
            {shopItems.commissionItems.length > 0 && (
              <div className="py-4">
                <h3 className="text-xl font-bold mb-4">Active Commissions</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {shopItems.commissionItems.map((item) => (
                    <div key={item._id}>
                      <ItemCard itemId={item._id} type={ITEM_TYPE.COMMISSION} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Marketplace Items */}
            {shopItems.marketplaceItems.length > 0 && (
              <div className="py-4">
                <h3 className="text-xl font-bold mb-4">Marketplace Listings</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {shopItems.marketplaceItems.map((item) => (
                    <div key={item._id}>
                      <ItemCard
                        itemId={item._id}
                        type={ITEM_TYPE.MARKETPLACE}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* No Items Message */}
            {shopItems.commissionItems.length === 0 &&
              shopItems.marketplaceItems.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  No items in shop yet
                </div>
              )}
          </div>
        </div>
      </div>
    </div>
  );
}

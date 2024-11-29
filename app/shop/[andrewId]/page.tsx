"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useUser } from "@clerk/nextjs";
import { ItemGrid } from "@/components/ItemGrid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil, Check, X, RotateCw } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ITEM_TYPE } from "@/convex/constants";
import Loading from "@/components/Loading";
import { Textarea } from "@/components/ui/textarea";
import ImageUploadModal from "@/components/ImageUploadModal";

export default function ShopPage() {
  // URL and authentication
  const params = useParams();
  const andrewId = typeof params?.andrewId === "string" ? params.andrewId : "";
  const { isSignedIn, user } = useUser();

  // Queries
  const shopOwner = useQuery(api.users.getUserByAndrewId, { andrewId });
  const userData = useQuery(api.users.getUserByClerkId, {
    clerkId: user?.id || "",
  });
  const shopItems = useQuery(api.users.getShopItems, {
    userId: shopOwner?._id ?? ("" as Id<"users">),
  });

  // Mutations
  const getFileUrl = useMutation(api.files.getUrl);
  const updateShop = useMutation(api.users.updateShopSettings);
  const deleteCommissionItem = useMutation(api.commItems.remove);
  const deleteMarketplaceItem = useMutation(api.mpItems.remove);

  // State management
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadType, setUploadType] = useState<"avatar" | "banner" | null>(
    null
  );
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);
  const [originalBannerUrl, setOriginalBannerUrl] = useState<string | null>(
    null
  );
  const [formData, setFormData] = useState({
    name: "",
    title: "",
    description: "",
  });

  const [preservedTitle, setPreservedTitle] = useState<string>("");
  const defaultShopTitle = useMemo(() => {
    if (!shopOwner?.name) return "";
    return `Welcome to ${shopOwner.name.split(" ")[0]}'s Shop`;
  }, [shopOwner?.name]);

  // Memoized values
  const isOwnShop = useMemo(
    () => isSignedIn && userData?.andrewId === andrewId,
    [isSignedIn, userData?.andrewId, andrewId]
  );

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
            setOriginalBannerUrl(shopOwner.shopBanner);
          } else {
            const url = await getFileUrl({
              storageId: shopOwner.shopBanner,
              userId: shopOwner.clerkId,
            });
            setBannerUrl(url);
            setOriginalBannerUrl(url);
          }
        } catch (error) {
          console.error("Error fetching banner URL:", error);
        }
      }
    };

    fetchBannerUrl();
  }, [shopOwner?.shopBanner, shopOwner?.clerkId, getFileUrl]);

  useEffect(() => {
    if (shopOwner) {
      const defaultTitle =
        shopOwner.shopTitle ||
        `Welcome to ${shopOwner.name.split(" ")[0]}'s Shop`;
      setFormData((prev) => ({
        ...prev,
        name: shopOwner.name,
        title: defaultTitle,
        description: shopOwner.shopDescription || "",
      }));
      setPreservedTitle(defaultTitle);
    }
  }, [shopOwner]);

  // Loading check
  if (!shopOwner || !shopItems) return <Loading />;

  // Event handlers
  const handleEditClick = () => {
    const currentTitle = shopOwner.shopTitle || defaultShopTitle;
    setFormData({
      name: shopOwner.name,
      title: currentTitle,
      description: shopOwner.shopDescription || "",
    });
    setPreservedTitle(currentTitle);
    setIsEditing(true);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isSignedIn || !isOwnShop || !user) return;

    setIsSaving(true);
    try {
      await updateShop({
        userId: user.id,
        name: formData.name,
        shopTitle: formData.title,
        shopBanner: shopOwner.shopBanner || "",
        shopDescription: formData.description,
      });
      setIsEditing(false);
    } catch (error) {
      console.error("Error saving shop:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: shopOwner.name,
      title: shopOwner.shopTitle || defaultShopTitle,
      description: shopOwner.shopDescription || "",
    });
    setBannerUrl(originalBannerUrl);
    setIsEditing(false);
  };

  const handleBannerUpdate = async (storageId: string) => {
    if (!isSignedIn || !isOwnShop || !user) return;

    try {
      await updateShop({
        userId: user.id,
        name: shopOwner.name,
        shopTitle: shopOwner.shopTitle || defaultShopTitle,
        shopBanner: storageId,
        shopDescription: shopOwner.shopDescription || "",
      });

      const url = await getFileUrl({
        storageId: storageId,
        userId: user.id,
      });
      setBannerUrl(url);
    } catch (error) {
      console.error("Error updating banner:", error);
    }
  };

  const handleResetBanner = async () => {
    if (!isSignedIn || !isOwnShop || !user || !shopOwner.shopBanner) return;

    try {
      await updateShop({
        userId: user.id,
        name: shopOwner.name,
        shopTitle: shopOwner.shopTitle || defaultShopTitle,
        shopBanner: "",
        shopDescription: shopOwner.shopDescription || "",
      });

      setBannerUrl(null);
    } catch (error) {
      console.error("Error reseting banner:", error);
    }
  };

  const handleAvatarUpload = async (storageId: string) => {
    if (!isSignedIn || !isOwnShop || !user) return;

    try {
      await updateShop({
        userId: user.id,
        name: shopOwner.name,
        shopTitle: shopOwner.shopTitle || defaultShopTitle,
        shopBanner: shopOwner.shopBanner || "",
        shopDescription: shopOwner.shopDescription || "",
        avatarUrl: storageId,
      });

      const url = await getFileUrl({
        storageId: storageId,
        userId: user.id,
      });
      setAvatarUrl(url);
    } catch (error) {
      console.error("Error updating avatar:", error);
    }
  };

  const handleDescriptionChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    const { value } = e.target;
    setFormData((prev) => ({
      ...prev,
      description: value,
    }));
    // Adjust the height of the textarea based on the content
    e.target.style.height = "auto"; // Reset height
    e.target.style.height = `${e.target.scrollHeight}px`; // Set height to scrollHeight
  };

  return (
    <div className="bg-gray-50">
      <form onSubmit={handleSave}>
        {/* Banner Section */}
        <div
          className={`relative h-64 bg-gray-200 ${isEditing ? "cursor-pointer" : ""}`}
          onClick={() => isOwnShop && setUploadType("banner")}
        >
          <div
            className="h-full w-full bg-cover bg-center"
            style={{
              backgroundImage: `url(${bannerUrl || "/assets/default-banner.png"})`,
            }}
          />
          {isOwnShop && (
            <>
              <div className="absolute inset-0 bg-black/30 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                <Pencil className="w-6 h-6 mr-2 text-white" />
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleResetBanner();
                }}
                className="absolute bottom-4 right-4 bg-white/90 font-bold hover:bg-white"
              >
                <RotateCw className="w-4 h-4 mr-2" />
                Reset Banner
              </Button>
            </>
          )}
        </div>

        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Profile Section */}
            <div className="w-full md:w-64 flex-shrink-0">
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="relative w-32 h-32 mx-auto">
                  <Avatar className="w-full h-full">
                    <AvatarImage
                      src={avatarUrl || "/assets/default-avatar.png"}
                    />
                    <AvatarFallback>{shopOwner.name[0]}</AvatarFallback>
                  </Avatar>

                  {isOwnShop && (
                    <div
                      className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity rounded-full cursor-pointer"
                      onClick={() => setUploadType("avatar")}
                    >
                      <Pencil className="w-6 h-6 text-white" />
                    </div>
                  )}
                </div>

                <h2 className="text-xl font-bold text-center mt-4">
                  {shopOwner.andrewId}
                </h2>

                {isOwnShop &&
                  (isEditing ? (
                    <div className="flex gap-2 mt-4">
                      <Button
                        type="submit"
                        variant="outline"
                        className="flex-1 font-bold"
                        disabled={isSaving}
                      >
                        <Check className="w-4 h-4 mr-2" />
                        {isSaving ? "Saving..." : "Save"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleCancel}
                        disabled={isSaving}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      onClick={handleEditClick}
                      variant="outline"
                      className="w-full font-bold mt-4"
                    >
                      <Pencil className="w-4 h-4 mr-2" />
                      Edit Profile
                    </Button>
                  ))}
              </div>
            </div>

            {/* Content Section */}
            <div className="flex-1 bg-white rounded-lg shadow-sm p-6">
              <div className="mb-8">
                {isEditing ? (
                  <Input
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className="!text-2xl font-semibold mb-4 border-0 ring-0 focus:ring-0 focus:outline-none shadow-none bg-transparent w-full p-0"
                    maxLength={35}
                  />
                ) : (
                  <h3 className="text-2xl font-semibold mb-4">
                    {shopOwner.shopTitle || defaultShopTitle}
                  </h3>
                )}

                {isEditing ? (
                  <Textarea
                    name="description"
                    value={formData.description}
                    onChange={handleDescriptionChange}
                    placeholder="Write a description for your shop..."
                    className="text-gray-600 !text-md leading-relaxed border-0 focus:ring-0 !p-0 focus:outline-none shadow-none bg-transparent w-full resize-none placeholder:text-gray-400"
                    style={{ minHeight: "10px", overflow: "hidden" }}
                    maxLength={400}
                  />
                ) : shopOwner.shopDescription ? (
                  <p className="text-gray-600 text-md leading-relaxed">
                    {shopOwner.shopDescription}
                  </p>
                ) : null}
              </div>

              {/* Item Grids */}
              {(shopItems.commissionItems.length > 0 || isOwnShop) && (
                <ItemGrid
                  title="Active Commissions"
                  items={shopItems.commissionItems}
                  type={ITEM_TYPE.COMMISSION}
                  isShopOwner={isOwnShop ?? false}
                  onDelete={async (itemId) => {
                    if (!user?.id) return;
                    try {
                      await deleteCommissionItem({
                        userId: user.id,
                        itemId: itemId as Id<"commItems">,
                      });
                    } catch (error) {
                      console.error("Error deleting commission item:", error);
                    }
                  }}
                />
              )}

              {(shopItems.marketplaceItems.length > 0 || isOwnShop) && (
                <ItemGrid
                  title="Marketplace Listings"
                  items={shopItems.marketplaceItems}
                  type={ITEM_TYPE.MARKETPLACE}
                  isShopOwner={isOwnShop ?? false}
                  onDelete={async (itemId) => {
                    if (!user?.id) return;
                    try {
                      await deleteMarketplaceItem({
                        userId: user.id,
                        itemId: itemId as Id<"mpItems">,
                      });
                    } catch (error) {
                      console.error("Error deleting marketplace item:", error);
                    }
                  }}
                />
              )}

              {!isOwnShop &&
                shopItems.commissionItems.length === 0 &&
                shopItems.marketplaceItems.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    No items in shop yet
                  </div>
                )}
            </div>
          </div>
        </div>
      </form>

      <ImageUploadModal
        isOpen={uploadType !== null}
        onClose={() => {
          setUploadType(null);
          setFormData((prev) => ({
            ...prev,
            title: preservedTitle || defaultShopTitle,
          }));
        }}
        onUpload={
          uploadType === "avatar" ? handleAvatarUpload : handleBannerUpdate
        }
        title={uploadType === "avatar" ? "Upload Avatar" : "Upload Banner"}
        isOwnShop={isOwnShop ?? false}
      />
    </div>
  );
}

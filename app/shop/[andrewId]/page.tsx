"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import Loading from "@/components/Loading";
import ImageUploadModal from "@/components/ImageUploadModal";
import BannerSection from "@/components/shop/BannerSection";
import ProfileSection from "@/components/shop/ProfileSection";
import ContentSection from "@/components/shop/ContentSection";

interface FormData {
  name: string;
  title: string;
  description: string;
}

export default function ShopPage() {
  // Router and Authentication
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const andrewId = typeof params?.andrewId === "string" ? params.andrewId : "";
  const { isSignedIn, user } = useUser();

  // Queries and Mutations
  const shopOwner = useQuery(api.users.getUserByAndrewId, { andrewId });
  const userData = useQuery(api.users.getUserByClerkId, {
    clerkId: user?.id || "",
  });
  const shopItems = useQuery(api.users.getShopItems, {
    userId: shopOwner?._id ?? ("" as Id<"users">),
  });
  const getFileUrl = useMutation(api.files.getUrl);
  const updateShop = useMutation(api.users.updateShopSettings);
  const createMarketplaceItem = useMutation(api.mpItems.create);
  const createCommissionItem = useMutation(api.commItems.create);

  // Local State
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadType, setUploadType] = useState<"avatar" | "banner" | null>(
    null
  );
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createItemType, setCreateItemType] = useState<
    "marketplace" | "commission" | null
  >(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);
  const [originalBannerUrl, setOriginalBannerUrl] = useState<string | null>(
    null
  );
  const [formData, setFormData] = useState<FormData>({
    name: "",
    title: "",
    description: "",
  });

  // Memoized Values
  const defaultShopTitle = useMemo(() => {
    if (!shopOwner?.name) return "";
    return `Welcome to ${shopOwner.name.split(" ")[0]}'s Shop`;
  }, [shopOwner?.name]);

  const isOwnShop = useMemo(
    () => Boolean(isSignedIn && userData?.andrewId === andrewId),
    [isSignedIn, userData?.andrewId, andrewId]
  );

  // Effects
  useEffect(() => {
    const fetchUrls = async () => {
      if (!shopOwner?.clerkId) return;

      try {
        // Fetch avatar URL
        if (shopOwner.avatarUrl) {
          const url = shopOwner.avatarUrl.startsWith("http")
            ? shopOwner.avatarUrl
            : await getFileUrl({
                storageId: shopOwner.avatarUrl,
                userId: shopOwner.clerkId,
              });
          setAvatarUrl(url);
        }

        // Fetch banner URL
        if (shopOwner.shopBanner) {
          const url = shopOwner.shopBanner.startsWith("http")
            ? shopOwner.shopBanner
            : await getFileUrl({
                storageId: shopOwner.shopBanner,
                userId: shopOwner.clerkId,
              });
          setBannerUrl(url);
          setOriginalBannerUrl(url);
        }
      } catch (error) {
        console.error("Error fetching URLs:", error);
        toast({
          title: "Error",
          description: "Failed to load shop images",
          variant: "destructive",
        });
      }
    };

    fetchUrls();
  }, [shopOwner, getFileUrl, toast]);

  useEffect(() => {
    if (shopOwner && !isEditing) {
      // Only update if not in edit mode
      setFormData({
        name: shopOwner.name,
        title: shopOwner.shopTitle || defaultShopTitle,
        description: shopOwner.shopDescription || "",
      });
    }
  }, [shopOwner, defaultShopTitle, isEditing]);

  // Event Handlers
  const handleEditClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (shopOwner) {
      setFormData({
        name: shopOwner.name,
        title: shopOwner.shopTitle || defaultShopTitle,
        description: shopOwner.shopDescription || "",
      });
      setIsEditing(true);
    }
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
        shopBanner: shopOwner?.shopBanner || "",
        shopDescription: formData.description,
      });
      setIsEditing(false);
      toast({
        title: "Success",
        description: "Shop settings updated successfully",
      });
    } catch (error) {
      console.error("Error saving shop:", error);
      toast({
        title: "Error",
        description: "Failed to update shop settings",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (shopOwner) {
      setFormData({
        name: shopOwner.name,
        title: shopOwner.shopTitle || defaultShopTitle,
        description: shopOwner.shopDescription || "",
      });
    }
    setBannerUrl(originalBannerUrl);
    setIsEditing(false);
  };

  const handleFileUpload = async (storageId: string) => {
    if (!isSignedIn || !isOwnShop || !user) return;

    try {
      await updateShop({
        userId: user.id,
        name: shopOwner?.name || "",
        shopTitle: shopOwner?.shopTitle || defaultShopTitle,
        shopBanner:
          uploadType === "banner" ? storageId : shopOwner?.shopBanner || "",
        shopDescription: shopOwner?.shopDescription || "",
        avatarUrl: uploadType === "avatar" ? storageId : shopOwner?.avatarUrl,
      });

      const url = await getFileUrl({
        storageId: storageId,
        userId: user.id,
      });

      if (uploadType === "avatar") {
        setAvatarUrl(url);
      } else {
        setBannerUrl(url);
        setOriginalBannerUrl(url);
      }

      toast({
        title: "Success",
        description: `${uploadType === "avatar" ? "Avatar" : "Banner"} updated successfully`,
      });
    } catch (error) {
      console.error("Error updating file:", error);
      toast({
        title: "Error",
        description: `Failed to update ${uploadType === "avatar" ? "avatar" : "banner"}`,
        variant: "destructive",
      });
    }
  };

  const handleResetBanner = async () => {
    if (!isSignedIn || !isOwnShop || !user) return;

    try {
      await updateShop({
        userId: user.id,
        name: shopOwner?.name || "",
        shopTitle: shopOwner?.shopTitle || defaultShopTitle,
        shopBanner: "",
        shopDescription: shopOwner?.shopDescription || "",
      });

      setBannerUrl(null);
      setOriginalBannerUrl(null);
      toast({
        title: "Success",
        description: "Banner removed successfully",
      });
    } catch (error) {
      console.error("Error resetting banner:", error);
      toast({
        title: "Error",
        description: "Failed to remove banner",
        variant: "destructive",
      });
    }
  };

  if (!shopOwner || !shopItems) {
    return <Loading />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <form onSubmit={handleSave}>
        <BannerSection
          bannerUrl={bannerUrl}
          isEditing={isEditing}
          isOwnShop={isOwnShop}
          setUploadType={setUploadType}
          handleResetBanner={handleResetBanner}
        />

        <ProfileSection
          shopOwner={{
            ...shopOwner,
            shopTitle: shopOwner.shopTitle ?? null,
            shopDescription: shopOwner.shopDescription ?? null,
          }}
          avatarUrl={avatarUrl}
          defaultShopTitle={defaultShopTitle}
          isOwnShop={isOwnShop}
          isEditing={isEditing}
          isSaving={isSaving}
          formData={formData}
          handleInputChange={handleInputChange}
          setUploadType={setUploadType}
          handleCancel={handleCancel}
          handleEditClick={handleEditClick}
        />

        <ContentSection shopItems={shopItems} isOwnShop={isOwnShop} />

        <ImageUploadModal
          isOpen={uploadType !== null}
          onClose={() => setUploadType(null)}
          onUpload={handleFileUpload}
          title={uploadType === "avatar" ? "Upload Avatar" : "Upload Banner"}
          isOwnShop={isOwnShop}
        />
      </form>
    </div>
  );
}

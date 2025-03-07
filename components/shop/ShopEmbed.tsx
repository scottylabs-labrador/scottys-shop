"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useUser } from "@clerk/nextjs";
import { useToast } from "@/hooks/use-toast";
import { usePathname } from "next/navigation";
import Loading from "@/components/utils/Loading";
import ImageUploadModal from "@/components/utils/ImageUploadModal";
import BannerSection from "@/components/shop/BannerSection";
import ProfileInfo from "@/components/shop/ProfileInfo";
import ShopInfo from "@/components/shop/ShopInfo";
import ShopDisplay from "@/components/shop/ShopDisplay";
import { ShopOwnerType, FormData } from "@/utils/ShopTypes";
import {
  getUserByAndrewId,
  getUserByClerkId,
  updateUser,
  type UserWithId,
} from "@/firebase/users";

type ShopComponentProps = {
  andrewId: string;
};

export const ShopEmbed = ({ andrewId }: ShopComponentProps) => {
  // Authentication
  const { toast } = useToast();
  const { isSignedIn, user } = useUser();
  const pathname = usePathname();

  // Local State
  const [shopOwner, setShopOwner] = useState<UserWithId | null>(null);
  const [userData, setUserData] = useState<UserWithId | null>(null);
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
  const [formData, setFormData] = useState<FormData>({
    name: "",
    title: "",
    description: "",
  });

  // Check if this is being viewed from the dashboard
  const isDashboard = useMemo(() => {
    return pathname?.includes("/dashboard");
  }, [pathname]);

  const adaptUserToShopOwner = (user: UserWithId): ShopOwnerType => {
    return {
      ...user,
      _id: user.id,
    };
  };

  // Fetch shop owner data and items
  useEffect(() => {
    const fetchShopData = async () => {
      try {
        // Fetch shop owner data
        const owner = await getUserByAndrewId(andrewId);
        if (!owner) {
          toast({
            title: "Error",
            description: "Shop not found",
            variant: "destructive",
          });
          return;
        }

        setShopOwner(owner);
        setAvatarUrl(owner.avatarUrl || null);
        setBannerUrl(owner.shopBanner || null);
        setOriginalBannerUrl(owner.shopBanner || null);
      } catch (error) {
        console.error("Error fetching shop data:", error);
        toast({
          title: "Error",
          description: "Failed to load shop data",
          variant: "destructive",
        });
      }
    };

    if (andrewId) {
      fetchShopData();
    }
  }, [andrewId, toast]);

  // Fetch current user data
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user?.id) return;

      try {
        const currentUser = await getUserByClerkId(user.id);
        if (currentUser) {
          setUserData(currentUser);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    if (isSignedIn) {
      fetchUserData();
    }
  }, [isSignedIn, user?.id]);

  // Memoized Values
  const defaultShopTitle = useMemo(() => {
    if (!shopOwner?.name) return "";
    return `Welcome to ${shopOwner.name.split(" ")[0]}'s Shop`;
  }, [shopOwner?.name]);

  const isOwnShop = useMemo(
    () => Boolean(isSignedIn && userData?.andrewId === andrewId),
    [isSignedIn, userData?.andrewId, andrewId]
  );

  // Effect to update form data when shop owner changes
  useEffect(() => {
    if (shopOwner && !isEditing) {
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
    if (!isSignedIn || !isOwnShop || !shopOwner) return;

    setIsSaving(true);
    try {
      await updateUser(shopOwner.id, {
        name: formData.name,
        shopTitle: formData.title,
        shopDescription: formData.description,
      });

      setShopOwner((prev) =>
        prev
          ? {
              ...prev,
              name: formData.name,
              shopTitle: formData.title,
              shopDescription: formData.description,
            }
          : null
      );

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

  const handleFileUpload = async (fileUrl: string) => {
    if (!isSignedIn || !isOwnShop || !shopOwner) return;

    try {
      const updates = {
        ...(uploadType === "avatar" && { avatarUrl: fileUrl }),
        ...(uploadType === "banner" && { shopBanner: fileUrl }),
      };

      await updateUser(shopOwner.id, updates);

      if (uploadType === "avatar") {
        setAvatarUrl(fileUrl);
        setShopOwner((prev) => (prev ? { ...prev, avatarUrl: fileUrl } : null));
      } else {
        setBannerUrl(fileUrl);
        setOriginalBannerUrl(fileUrl);
        setShopOwner((prev) =>
          prev ? { ...prev, shopBanner: fileUrl } : null
        );
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
    } finally {
      setUploadType(null);
    }
  };

  const handleResetBanner = async () => {
    if (!isSignedIn || !isOwnShop || !shopOwner) return;

    try {
      await updateUser(shopOwner.id, {
        shopBanner: "",
      });

      setBannerUrl(null);
      setOriginalBannerUrl(null);
      setShopOwner((prev) => (prev ? { ...prev, shopBanner: "" } : null));

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

  if (!shopOwner) {
    return <Loading />;
  }

  return (
    <div className="min-h-screen bg-white">
      <form onSubmit={handleSave}>
        {/* Banner Section - Now allows editing for shop owners regardless of editing state */}
        <BannerSection
          bannerUrl={bannerUrl}
          isEditing={isEditing}
          isOwnShop={isOwnShop}
          setUploadType={setUploadType}
          handleResetBanner={handleResetBanner}
        />

        <div className="mx-auto max-w-7xl py-4">
          {/* Two column layout below banner */}
          <div className="flex flex-col md:flex-row gap-5">
            {/* Left sidebar with avatar and profile info */}
            <div className="md:w-80 flex-shrink-0 justifyContent-start">
              <ProfileInfo
                shopOwner={shopOwner ? adaptUserToShopOwner(shopOwner) : null}
                avatarUrl={avatarUrl}
                isOwnShop={isOwnShop}
                setUploadType={setUploadType}
              />
            </div>

            {/* Right section with shop description and content */}
            <div className="flex-1">
              {/* Shop Description */}
              <div className="mb-8">
                <ShopInfo
                  shopTitle={shopOwner.shopTitle || null}
                  shopDescription={shopOwner.shopDescription || null}
                  defaultShopTitle={defaultShopTitle}
                  isOwnShop={isOwnShop}
                  isEditing={isEditing}
                  isSaving={isSaving}
                  formData={formData}
                  handleInputChange={handleInputChange}
                  handleCancel={handleCancel}
                  handleEditClick={handleEditClick}
                />
              </div>

              {/* Shop Section */}
              <ShopDisplay
                sellerId={shopOwner?.id ?? ""}
                isOwnShop={isOwnShop}
                isDashboard={isDashboard}
                isEditing={isEditing}
                handleEditClick={handleEditClick}
              />
            </div>
          </div>
        </div>

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
};

export default ShopEmbed;

/**
 * Main shop component that integrates all shop-related functionality
 * Handles shop data fetching, state management, and rendering
 */
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
import { ShopFormData, User, AndrewID } from "@/utils/types";

type ShopComponentProps = {
  andrewId: AndrewID;
};

export const ShopEmbed = ({ andrewId }: ShopComponentProps) => {
  const { toast } = useToast();
  const { isSignedIn, user } = useUser();
  const pathname = usePathname();

  const [shopOwner, setShopOwner] = useState<User | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
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
  const [formData, setFormData] = useState<ShopFormData>({
    username: "",
    title: "",
    description: "",
  });

  const isDashboard = useMemo(() => {
    return pathname?.includes("/dashboard");
  }, [pathname]);

  // Fetch shop owner data
  useEffect(() => {
    const fetchShopData = async () => {
      try {
        const response = await fetch(`/api/users/${andrewId}`);
        if (!response.ok) {
          toast({
            title: "Error",
            description: "Shop not found",
            variant: "destructive",
          });
          return;
        }

        const owner: User = await response.json();
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

    if (isSignedIn) {
      fetchCurrentUser();
    }
  }, [isSignedIn, user?.id]);

  const defaultShopTitle = useMemo(() => {
    if (!shopOwner?.username) return "";
    return `Welcome to ${shopOwner.username.split(" ")[0]}'s Shop`;
  }, [shopOwner?.username]);

  const isOwnShop = useMemo(
    () => Boolean(isSignedIn && currentUser?.andrewId === andrewId),
    [isSignedIn, currentUser?.andrewId, andrewId]
  );

  useEffect(() => {
    if (shopOwner && !isEditing) {
      setFormData({
        username: shopOwner.username,
        title: shopOwner.shopTitle || defaultShopTitle,
        description: shopOwner.shopDescription || "",
      });
    }
  }, [shopOwner, defaultShopTitle, isEditing]);

  const handleEditClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (shopOwner) {
      setFormData({
        username: shopOwner.username,
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
      const response = await fetch("/api/users/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: formData.username,
          shopTitle: formData.title,
          shopDescription: formData.description,
        }),
      });

      if (response.ok) {
        setShopOwner((prev) =>
          prev
            ? {
                ...prev,
                username: formData.username,
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
      } else {
        throw new Error("Failed to update shop settings");
      }
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
        username: shopOwner.username,
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

      const response = await fetch("/api/users/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        if (uploadType === "avatar") {
          setAvatarUrl(fileUrl);
          setShopOwner((prev) =>
            prev ? { ...prev, avatarUrl: fileUrl } : null
          );
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
      } else {
        throw new Error("Failed to update file");
      }
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
      const response = await fetch("/api/users/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shopBanner: "" }),
      });

      if (response.ok) {
        setBannerUrl(null);
        setOriginalBannerUrl(null);
        setShopOwner((prev) => (prev ? { ...prev, shopBanner: "" } : null));

        toast({
          title: "Success",
          description: "Banner removed successfully",
        });
      } else {
        throw new Error("Failed to remove banner");
      }
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
        <BannerSection
          bannerUrl={bannerUrl}
          isEditing={isEditing}
          isOwnShop={isOwnShop}
          setUploadType={setUploadType}
          handleResetBanner={handleResetBanner}
        />

        <div className="mx-auto max-w-7xl py-4">
          <div className="flex flex-col md:flex-row gap-5">
            <div className="md:w-80 flex-shrink-0 justifyContent-start">
              <ProfileInfo
                shopOwner={shopOwner}
                avatarUrl={avatarUrl}
                isOwnShop={isOwnShop}
                setUploadType={setUploadType}
              />
            </div>

            <div className="flex-1">
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

              <ShopDisplay
                andrewId={andrewId}
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

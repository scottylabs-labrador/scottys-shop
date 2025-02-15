import React from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Camera, Check, X, Pencil, Calendar } from "lucide-react";
import { ShopOwnerType } from "@/utils/ShopTypes";

interface ProfileSectionProps {
  shopOwner: ShopOwnerType | null;
  avatarUrl: string | null;
  defaultShopTitle: string;
  isOwnShop: boolean;
  isEditing: boolean;
  isSaving: boolean;
  formData: {
    name: string;
    title: string;
    description: string;
  };
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  setUploadType: (type: "avatar" | "banner" | null) => void;
  handleCancel: () => void;
  handleEditClick: (e: React.MouseEvent) => void;
}

const ProfileSection = ({
  shopOwner,
  avatarUrl,
  defaultShopTitle,
  isOwnShop,
  isEditing,
  isSaving,
  formData,
  handleInputChange,
  setUploadType,
  handleCancel,
  handleEditClick,
}: ProfileSectionProps) => {
  if (!shopOwner) return null;  // Early return if no shop owner

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
  };

  return (
    <div className="mx-auto max-w-7xl py-8">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Avatar and Basic Info Column */}
          <div className="flex flex-col items-center md:items-start space-y-4 md:w-64">
            <div className="relative group">
              <Avatar className="w-32 h-32 rounded-full border-2 border-gray-200">
                <AvatarImage 
                  src={avatarUrl || ""} 
                  alt={shopOwner.name} 
                  className="object-cover"
                />
                <AvatarFallback className="text-2xl font-medium">
                  {shopOwner.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {isOwnShop && isEditing && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute bottom-2 right-2 rounded-full bg-white shadow-lg hover:bg-gray-100"
                  onClick={() => setUploadType("avatar")}
                >
                  <Camera className="w-4 h-4 text-gray-600" />
                </Button>
              )}
            </div>

            <div className="text-center md:text-left space-y-2">
              <span className="font-medium text-lg text-gray-900 block">
                {shopOwner.andrewId}
              </span>
              <div className="flex items-center gap-1 text-gray-500 text-sm">
                <Calendar className="w-4 h-4 flex-shrink-0" />
                <span>Shop opened {formatDate(shopOwner.createdAt)}</span>
              </div>
            </div>
          </div>

          {/* Shop Info Section */}
          <div className="flex-1 space-y-6 md:border-l-2 md:border-gray-200 md:pl-6">
            <div className="space-y-4">
              {isEditing ? (
                <>
                  <Input
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className="border-2 border-gray-200 px-4 py-2 rounded-lg bg-white text-lg font-medium"
                    maxLength={35}
                    placeholder="Enter shop title..."
                  />
                  <Textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Write a description for your shop..."
                    className="text-gray-600 resize-none border-2 border-gray-200 px-4 py-3 rounded-lg bg-white min-h-32"
                    maxLength={400}
                  />
                  <p className="text-sm text-gray-500">
                    {formData.description.length}/400 characters
                  </p>
                </>
              ) : (
                <>
                  <h1 className="text-4xl font-medium text-gray-900 leading-tight">
                    {shopOwner.shopTitle || defaultShopTitle}
                  </h1>
                  <div className="text-md text-gray-600 leading-relaxed">
                    {shopOwner.shopDescription || (
                      <p className="text-gray-400 italic">
                        No description provided yet
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          {isOwnShop && (
            <div className="flex gap-2 md:self-start mt-4 md:mt-0">
              {isEditing ? (
                <>
                  <Button
                    type="submit"
                    disabled={isSaving}
                    className="bg-black hover:bg-gray-800 text-white border-2 border-black"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    {isSaving ? "Saving..." : "Save Changes"}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancel}
                    className="hover:bg-gray-100 border-2 border-gray-300"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                </>
              ) : (
                <Button
                  type="button"
                  onClick={handleEditClick}
                  className="hover:bg-gray-100 border-2 border-gray-300 bg-white text-gray-800"
                >
                  <Pencil className="w-4 h-4 mr-2" />
                  Edit Shop
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileSection;
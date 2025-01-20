import React from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Camera, Check, X, Pencil, MapPin, Calendar } from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";

interface ShopOwnerType {
  _id: Id<"users">;
  name: string;
  shopTitle: string | null;
  shopDescription: string | null;
  avatarUrl?: string;
  shopBanner?: string;
  createdAt: number;
  clerkId?: string;
  andrewId: string;
  location?: string;
}

interface FormData {
  name: string;
  title: string;
  description: string;
}

interface ProfileSectionProps {
  shopOwner: ShopOwnerType;
  avatarUrl: string | null;
  defaultShopTitle: string;
  isOwnShop: boolean;
  isEditing: boolean;
  isSaving: boolean;
  formData: FormData;
  handleInputChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  setUploadType: (type: "avatar" | "banner" | null) => void;
  handleCancel: () => void;
  handleEditClick: (e: React.MouseEvent) => void;
}

export default function ProfileSection({
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
}: ProfileSectionProps) {
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
  };

  return (
    <div className="mx-auto max-w-7xl py-8">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="flex flex-col md:flex-row gap-2 ">
          {/* Avatar and Shop Info Column */}
          <div className="flex flex-col items-center md:items-start space-y-2 md:w-64">
            <div className="relative group">
              <Avatar className="w-32 h-32 rounded-full border-2 border-black">
                <AvatarImage src={avatarUrl || ""} alt={shopOwner.name} />
              </Avatar>
              {isOwnShop && isEditing && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute bottom-2 right-2 rounded-full bg-white shadow-lg hover:bg-orange-50 transition-all duration-200"
                  onClick={() => setUploadType("avatar")}
                >
                  <Camera className="w-4 h-4 text-[#C41230]" />
                </Button>
              )}
            </div>
            <div className="text-center md:text-left">
              <span className="font-medium font-rubik  text-lg text-gray-900">
                {shopOwner.andrewId}
              </span>
              <div className="flex items-center gap-1 text-gray-500 text-sm mt-1">
                <Calendar className="w-4 h-4" />
                <span>Shop opened {formatDate(shopOwner.createdAt)}</span>
              </div>
              {shopOwner.location && (
                <div className="flex items-center gap-1 text-gray-500 text-sm mt-1">
                  <MapPin className="w-4 h-4" />
                  <span>{shopOwner.location}</span>
                </div>
              )}
            </div>
          </div>

          {/* Shop Info Section */}
          <div className="flex-1 space-y-6 border-l-2 border-gray-200 pl-6">
            <div className="space-y-4">
              {isEditing ? (
                <>
                  <Input
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className="border-2 border-gray-200 px-2 py-2 focus:ring-2 focus:ring-gray-200 focus:border-gray-500 rounded-md bg-white"
                    maxLength={35}
                    placeholder="Enter shop title..."
                  />
                  <Textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Write a description for your shop..."
                    className="text-gray-600 resize-none border-2 border-gray-200 px-2 py-2 focus:ring-2 focus:ring-gray-200 focus:border-gray-500 rounded-md bg-white min-h-32"
                    maxLength={400}
                  />
                </>
              ) : (
                <>
                  <h1 className="text-4xl font-caladea font-medium text-gray-900 leading-tight">
                    {shopOwner.shopTitle || defaultShopTitle}
                  </h1>
                  <div className="text-md  font-rubik text-gray-600 leading-relaxed">
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
            <div className="flex gap-2 md:self-start mt-6 md:mt-0">
              {isEditing ? (
                <>
                  <Button
                    type="submit"
                    disabled={isSaving}
                    className="bg-black hover:bg-gray-700 text-white font-rubik border-2 border-black transition-colors duration-200 shadow-sm"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    {isSaving ? "Saving..." : "Save Changes"}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancel}
                    className="hover:bg-gray-200 border-2 border-black text-black font-rubik transition-colors duration-200"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                </>
              ) : (
                <Button
                  type="button"
                  onClick={handleEditClick}
                  className="hover:bg-gray-200 font-rubik text-black border-2 border-black  bg-white transition-colors duration-200 shadow-sm"
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
}

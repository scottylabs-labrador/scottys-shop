import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Camera, Calendar } from "lucide-react";
import { ShopOwnerType } from "@/utils/ShopTypes";

interface ProfileInfoProps {
  shopOwner: ShopOwnerType | null;
  avatarUrl: string | null;
  isOwnShop: boolean;
  setUploadType: (type: "avatar" | "banner" | null) => void;
}

const ProfileInfo = ({
  shopOwner,
  avatarUrl,
  isOwnShop,
  setUploadType,
}: ProfileInfoProps) => {
  if (!shopOwner) return null;

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
  };

  return (
    <div className="bg-white rounded-lg">
      <div className="flex flex-col items-start space-y-4 px-6">
        <div className="flex items-center space-x-4 justifyContent-start">
          <div className="relative group">
            <Avatar className="w-[115px] h-[115px] rounded-full border-[3px] border-black">
              <AvatarImage
                src={avatarUrl || ""}
                alt={shopOwner.name}
                className="object-cover"
              />
              <AvatarFallback className="text-2xl font-medium">
                {shopOwner.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {isOwnShop && (
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
          <span className="font-semibold text-2xl text-gray-900  font-rubik">
            {shopOwner.andrewId}
          </span>
        </div>
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-1 text-gray-500 text-sm">
            <Calendar className="w-4 h-4 flex-shrink-0" />
            <span>Shop opened {formatDate(shopOwner.createdAt)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileInfo;

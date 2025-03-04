import React from "react";
import { Button } from "@/components/ui/button";
import { Camera, RotateCw } from "lucide-react";

interface BannerSectionProps {
  bannerUrl: string | null;
  isEditing: boolean;
  isOwnShop: boolean;
  setUploadType: (type: "avatar" | "banner" | null) => void;
  handleResetBanner: () => Promise<void>;
}

export default function BannerSection({
  bannerUrl,
  isOwnShop,
  setUploadType,
  handleResetBanner,
}: BannerSectionProps) {
  const handleBannerReset = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await handleResetBanner();
  };

  return (
    <div className="relative bg-gradient-to-b from-gray-900 to-gray-800">
      <div
        className="relative h-80 overflow-hidden"
        role="banner"
        onClick={() => isOwnShop && setUploadType("banner")}
      >
        {/* Banner Image */}
        <div
          className="h-full w-full bg-cover bg-center transition-all duration-300"
          style={{
            backgroundImage: `url(${bannerUrl || "/assets/default-banner.png"})`,
          }}
          aria-label="Shop banner"
        />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        
        {/* Edit Controls */}
        {isOwnShop && (
          <>
            <div className="absolute inset-0 bg-black/30 opacity-0 hover:opacity-100 transition-all duration-200 flex items-center justify-center cursor-pointer group">
              <div className="transform translate-y-4 group-hover:translate-y-0 transition-all duration-200 flex flex-col items-center justify-center">
                <Camera className="w-12 h-12 text-white" />
                <p className="text-white text-sm mt-2 font-rubik text-center">
                  Click to change banner
                </p>
              </div>
            </div>
            
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleBannerReset}
              className="absolute bottom-4 right-4 bg-white/90 font-rubik hover:bg-gray-300 transition-all duration-200"
            >
              <RotateCw className="w-4 h-4 mr-2" />
              Reset Banner
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
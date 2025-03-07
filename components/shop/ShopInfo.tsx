import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Check, X } from "lucide-react";

interface ShopInfoProps {
  shopTitle: string | null;
  shopDescription: string | null;
  defaultShopTitle: string;
  isOwnShop: boolean;
  isEditing: boolean;
  isSaving: boolean;
  formData: {
    name: string;
    title: string;
    description: string;
  };
  handleInputChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  handleCancel: () => void;
  handleEditClick: (e: React.MouseEvent) => void;
}

const ShopInfo = ({
  shopTitle,
  shopDescription,
  defaultShopTitle,
  isOwnShop,
  isEditing,
  isSaving,
  formData,
  handleInputChange,
  handleCancel,
  handleEditClick,
}: ShopInfoProps) => {
  return (
    <div className="bg-white rounded-lg pt-4">
      <div className="space-y-4">
        {isEditing ? (
          <>
            <Input
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className="border-2 border-gray-200 px-4 py-2 rounded-lg bg-white text-lg focus:border-black focus:border-2 font-medium"
              maxLength={35}
              placeholder="Enter shop title..."
            />
            <Textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Write a description for your shop..."
              className="text-gray-600 resize-none border-2 border-gray-200 px-4 py-3 rounded-lg bg-white min-h-32 focus:border-black focus:border-2"
              maxLength={400}
            />
            <p className="text-sm text-gray-500">
              {formData.description.length}/400 characters
            </p>
          </>
        ) : (
          <>
            <h1 className="text-3xl font-rubik font-semibold text-gray-900 leading-tight">
              {shopTitle || defaultShopTitle}
            </h1>
            <div className="text-md text-gray-600 leading-relaxed">
              {shopDescription || (
                <p className="text-gray-400 italic">
                  No description provided yet
                </p>
              )}
            </div>
          </>
        )}
      </div>

      {/* Action Buttons - Only shown when editing */}
      {isOwnShop && isEditing && (
        <div className="flex gap-2 mt-4 justify-end">
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
        </div>
      )}
    </div>
  );
};

export default ShopInfo;

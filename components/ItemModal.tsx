"use client";

import React from "react";
import { useMutation } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Check, Loader2, X, Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useImageUpload } from "@/hooks/use-image-upload";
import { useFormState } from "@/hooks/use-form-state";
import {
  ITEM_CATEGORIES,
  ITEM_TYPE,
  type AnyItem,
  type MarketplaceItem,
  type CommissionItem,
} from "@/convex/constants";

const CONDITIONS = ["New", "Like New", "Good", "Fair", "Poor"] as const;
const MAX_IMAGES = 10;

type ItemModalProps = {
  isOpen: boolean;
  onClose: () => void;
  type: (typeof ITEM_TYPE)[keyof typeof ITEM_TYPE];
  mode: "create" | "update";
  item?: AnyItem;
};

// Form field components
const FormField = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <div>
    <Label className="font-bold">{label}</Label>
    {children}
  </div>
);

const ImageUploader = ({
  images,
  imageUrls,
  onUpload,
  onRemove,
  isUploading,
}: {
  images: string[];
  imageUrls: string[];
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  onRemove: (index: number) => void;
  isUploading: boolean;
}) => (
  <div>
    <Label className="font-bold">
      Images ({images.length}/{MAX_IMAGES})
    </Label>
    <div className="grid grid-cols-5 gap-2 mt-2">
      {imageUrls.map((url, index) => (
        <div key={index} className="relative aspect-square">
          <Image
            loader={({ src }) => src}
            src={url}
            alt={`Item image ${index + 1}`}
            fill
            className="object-cover rounded-md"
          />
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-1"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ))}
      {images.length < MAX_IMAGES && (
        <label className="aspect-square border-2 border-dashed rounded-md flex items-center justify-center cursor-pointer">
          <input
            type="file"
            accept="image/*"
            onChange={onUpload}
            className="hidden"
            disabled={isUploading}
          />
          {isUploading ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : (
            <Upload className="h-6 w-6" />
          )}
        </label>
      )}
    </div>
  </div>
);

const TagInput = ({
  tags,
  currentTag,
  onTagChange,
  onTagAdd,
  onTagRemove,
}: {
  tags: string[];
  currentTag: string;
  onTagChange: (value: string) => void;
  onTagAdd: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onTagRemove: (tag: string) => void;
}) => (
  <div>
    <Label className="font-bold">Tags</Label>
    <div className="flex flex-wrap gap-2 mb-2">
      {tags.map((tag) => (
        <Badge key={tag} variant="secondary">
          {tag}
          <button
            type="button"
            onClick={() => onTagRemove(tag)}
            className="ml-2"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}
    </div>
    <Input
      value={currentTag}
      onChange={(e) => onTagChange(e.target.value)}
      onKeyDown={onTagAdd}
      placeholder="Type tag and press Enter"
    />
  </div>
);

export default function ItemModal({
  isOpen,
  onClose,
  type,
  mode,
  item,
}: ItemModalProps) {
  const { user } = useUser();
  const { toast } = useToast();
  const createCommItem = useMutation(api.commItems.create);
  const updateCommItem = useMutation(api.commItems.update);
  const createMpItem = useMutation(api.mpItems.create);
  const updateMpItem = useMutation(api.mpItems.update);

  const {
    formData,
    setFormData,
    handleInputChange,
    handleSelectChange,
    resetForm,
  } = useFormState(item);

  const {
    images,
    imageUrls,
    isUploading,
    handleImageUpload,
    handleRemoveImage,
    resetImages,
  } = useImageUpload({
    maxImages: MAX_IMAGES,
    userId: user?.id,
    initialImages: item?.images,
    toast,
  });

  const [currentTag, setCurrentTag] = React.useState("");
  const [tags, setTags] = React.useState<string[]>(item?.tags || []);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleClose = () => {
    resetForm();
    resetImages();
    setTags([]);
    setCurrentTag("");
    onClose();
  };

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && currentTag.trim()) {
      e.preventDefault();
      if (!tags.includes(currentTag.trim())) {
        setTags((prev) => [...prev, currentTag.trim()]);
      }
      setCurrentTag("");
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user?.id) return;

    setIsSubmitting(true);
    try {
      const baseData = {
        userId: user.id,
        title: formData.title,
        description: formData.description,
        price: parseFloat(formData.price),
        category: formData.category,
        tags,
        images,
      };

      if (type === ITEM_TYPE.COMMISSION) {
        const commData = {
          ...baseData,
          turnaroundDays: parseInt(formData.turnaroundDays),
        };

        if (mode === "create") {
          await createCommItem(commData);
        } else if (item) {
          await updateCommItem({
            itemId: item._id as Id<"commItems">,
            ...commData,
          });
        }
      } else {
        const mpData = {
          ...baseData,
          condition: formData.condition,
        };

        if (mode === "create") {
          await createMpItem(mpData);
        } else if (item) {
          await updateMpItem({
            itemId: item._id as Id<"mpItems">,
            ...mpData,
          });
        }
      }

      toast({
        title: `${mode === "create" ? "Created" : "Updated"} successfully`,
        description: `Item has been ${mode === "create" ? "created" : "updated"}.`,
      });
      handleClose();
    } catch (error) {
      console.error("Error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save item. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="!w-[99vw] !max-w-[1200px] !h-[70vh] !mt-14 p-4 overflow-y-auto mx-auto">
        <DialogHeader className="mb-3">
          <DialogTitle className="text-lg font-semibold">
            {mode === "create" ? "Create" : "Update"}{" "}
            {type === ITEM_TYPE.COMMISSION ? "Commission" : "Marketplace"} Item
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid gap-3">
            <div className="grid md:grid-cols-2 gap-3">
              <FormField label="Title">
                <Input
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  className="w-full"
                />
              </FormField>

              <FormField label="Price ($)">
                <Input
                  name="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={handleInputChange}
                  required
                  className="w-full"
                />
              </FormField>
            </div>

            <FormField label="Description">
              <Textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
                className="min-h-[60px] w-full resize-none"
              />
            </FormField>

            <div className="grid md:grid-cols-2 gap-3">
              <FormField label="Category">
                <Select
                  value={formData.category}
                  onValueChange={(value) =>
                    handleSelectChange("category", value)
                  }
                  required
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(ITEM_CATEGORIES).map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>

              {type === ITEM_TYPE.COMMISSION ? (
                <FormField label="Turnaround Days">
                  <Input
                    name="turnaroundDays"
                    type="number"
                    min="1"
                    value={formData.turnaroundDays}
                    onChange={handleInputChange}
                    required
                    className="w-full"
                  />
                </FormField>
              ) : (
                <FormField label="Condition">
                  <Select
                    value={formData.condition}
                    onValueChange={(value) =>
                      handleSelectChange("condition", value)
                    }
                    required
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select condition" />
                    </SelectTrigger>
                    <SelectContent>
                      {CONDITIONS.map((condition) => (
                        <SelectItem key={condition} value={condition}>
                          {condition}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-3">
              <ImageUploader
                images={images}
                imageUrls={imageUrls}
                onUpload={handleImageUpload}
                onRemove={handleRemoveImage}
                isUploading={isUploading}
              />

              <TagInput
                tags={tags}
                currentTag={currentTag}
                onTagChange={setCurrentTag}
                onTagAdd={handleAddTag}
                onTagRemove={(tag) =>
                  setTags((prev) => prev.filter((t) => t !== tag))
                }
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button type="button" variant="outline" onClick={handleClose}>
              <div className="font-bold">Cancel</div>
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="min-w-[90px] font-bold"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {mode === "create" ? "Creating..." : "Updating..."}
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  {mode === "create" ? "Create" : "Update"}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

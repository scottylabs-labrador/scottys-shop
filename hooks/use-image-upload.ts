import { useState, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { ToastType } from "@/hooks/use-toast";

interface ImageUploadOptions {
  maxImages: number;
  userId?: string;
  initialImages?: string[];
  toast: ToastType;
}

export function useImageUpload({
  maxImages,
  userId,
  initialImages,
  toast,
}: ImageUploadOptions) {
  const [images, setImages] = useState<string[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const getUrl = useMutation(api.files.getUrl);

  useEffect(() => {
    const loadImageUrls = async () => {
      if (!userId || images.length === 0) {
        setImageUrls([]);
        return;
      }

      try {
        const urls = await Promise.all(
          images.map(async (id) => {
            if (id.startsWith("http")) return id;
            return await getUrl({ storageId: id, userId });
          })
        );
        setImageUrls(urls.filter(Boolean) as string[]);
      } catch (error) {
        console.error("Error loading images:", error);
        toast({
          variant: "destructive",
          title: "Failed to load images",
          description: "There was an error loading the item images.",
        });
      }
    };

    loadImageUrls();
  }, [images, userId, getUrl, toast]);

  useEffect(() => {
    if (initialImages) {
      setImages(initialImages);
    }
  }, [initialImages]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;

    if (images.length >= maxImages) {
      toast({
        variant: "destructive",
        title: "Maximum images reached",
        description: `You can only upload up to ${maxImages} images.`,
      });
      return;
    }

    setIsUploading(true);
    try {
      const uploadUrl = await generateUploadUrl({
        userId,
        contentType: file.type,
      });

      const uploadResponse = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!uploadResponse.ok) throw new Error("Upload failed");

      const storageId = await uploadResponse.text();
      const imageUrl = await getUrl({
        storageId,
        userId,
      });

      if (!imageUrl) throw new Error("Failed to get image URL");

      setImages((prev) => [...prev, storageId]);
      setImageUrls((prev) => [...prev, imageUrl]);
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: "Failed to upload image.",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setImageUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const resetImages = () => {
    setImages([]);
    setImageUrls([]);
  };

  return {
    images,
    imageUrls,
    isUploading,
    handleImageUpload,
    handleRemoveImage,
    resetImages,
  };
}

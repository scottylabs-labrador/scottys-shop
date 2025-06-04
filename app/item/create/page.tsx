"use client";
import React, { useState, useEffect, FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SignIn, useUser } from "@clerk/nextjs";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Loading from "@/components/utils/Loading";
import ItemForm from "@/components/items/create/ItemForm";
import ImageUpload from "@/components/items/create/ImageUpload";
import { ITEM_CATEGORIES, ITEM_CONDITIONS } from "@/utils/itemConstants";
import { useToast } from "@/hooks/use-toast";
import { User } from "@/utils/types";

export default function CreateItemPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const { toast } = useToast();

  const [itemType, setItemType] = useState<"marketplace" | "commission">(
    "marketplace"
  );
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [imageUploading, setImageUploading] = useState(false);

  // Form data states
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    category: "",
    condition: "",
    tags: "",
  });

  // Form validation errors
  const [errors, setErrors] = useState<{
    title?: string;
    description?: string;
    price?: string;
    category?: string;
    condition?: string;
    tags?: string;
    images?: string;
  }>({});

  // Set item type from URL
  useEffect(() => {
    const type = searchParams.get("type");
    if (type === "commission" || type === "marketplace") {
      setItemType(type);
    }
  }, [searchParams]);

  // Fetch current user
  useEffect(() => {
    const fetchCurrentUser = async () => {
      if (!isLoaded || !user) return;

      try {
        const response = await fetch("/api/users/current", { method: "POST" });
        if (response.ok) {
          const userData: User = await response.json();
          setCurrentUser(userData);
        }
      } catch (error) {
        console.error("Error fetching current user:", error);
        toast({
          title: "Error",
          description: "Failed to fetch user data",
          variant: "destructive",
        });
      }
    };

    fetchCurrentUser();
  }, [isLoaded, user, toast]);

  const handleFormChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  // Handle file input change
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      processNewImages(newFiles);
    }
  };

  const processNewImages = (newFiles: File[]) => {
    const validFiles = newFiles.filter(
      (file) =>
        file.type === "image/jpeg" ||
        file.type === "image/png" ||
        file.type === "image/webp"
    );

    const oversizedFiles = validFiles.filter(
      (file) => file.size > 5 * 1024 * 1024
    );
    if (oversizedFiles.length > 0) {
      setErrors((prev) => ({
        ...prev,
        images: `${oversizedFiles.length} file(s) exceed 5MB limit`,
      }));
      return;
    }

    if (images.length + validFiles.length > 5) {
      setErrors((prev) => ({
        ...prev,
        images: "You can upload a maximum of 5 images",
      }));
      return;
    }

    setImages((prevImages) => [...prevImages, ...validFiles]);
    setErrors((prev) => ({ ...prev, images: undefined }));

    validFiles.forEach((file) => {
      const url = URL.createObjectURL(file);
      setImageUrls((prev) => [...prev, url]);
    });
  };

  const removeNewImage = (index: number) => {
    if (images.length <= 1) {
      setErrors((prev) => ({
        ...prev,
        images: "At least one image is required",
      }));
      return;
    }

    setImages((prevImages) => {
      const newImages = [...prevImages];
      newImages.splice(index, 1);
      return newImages;
    });
    setImageUrls((prevUrls) => {
      const newUrls = [...prevUrls];
      URL.revokeObjectURL(newUrls[index]);
      newUrls.splice(index, 1);
      return newUrls;
    });

    setErrors((prev) => ({ ...prev, images: undefined }));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const files = Array.from(e.dataTransfer.files);
    const imageFiles = files.filter(
      (file) =>
        file.type === "image/jpeg" ||
        file.type === "image/png" ||
        file.type === "image/webp"
    );

    if (imageFiles.length > 0) {
      processNewImages(imageFiles);
    }
  };

  // Upload images via API
  const uploadImages = async (): Promise<string[]> => {
    if (images.length === 0) return [];

    setImageUploading(true);
    try {
      const formData = new FormData();
      images.forEach((image) => {
        formData.append(`images`, image);
      });

      const response = await fetch("/api/upload/images", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload images");
      }

      const result = await response.json();
      return result.urls;
    } catch (error) {
      console.error("Error uploading images:", error);
      throw error;
    } finally {
      setImageUploading(false);
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors: typeof errors = {};

    if (!formData.title || formData.title.length < 3) {
      newErrors.title = "Title must be at least 3 characters";
    } else if (formData.title.length > 100) {
      newErrors.title = "Title cannot exceed 100 characters";
    }

    if (!formData.description || formData.description.length < 10) {
      newErrors.description = "Description must be at least 10 characters";
    } else if (formData.description.length > 1000) {
      newErrors.description = "Description cannot exceed 1000 characters";
    }

    const numPrice = formData.price ? Number(formData.price) : 0;
    if (!formData.price || numPrice <= 0) {
      newErrors.price = "Price must be greater than 0";
    } else if (numPrice > 1000000) {
      newErrors.price = "Price cannot exceed $1,000,000";
    }

    if (!formData.category) {
      newErrors.category = "Please select a category";
    }

    if (itemType === "marketplace" && !formData.condition) {
      newErrors.condition = "Please select condition";
    }

    if (images.length === 0) {
      newErrors.images = "At least one image is required";
    }

    if (formData.tags.length > 200) {
      newErrors.tags = "Tags cannot exceed 200 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors in the form",
        variant: "destructive",
      });
      return;
    }

    if (!currentUser) {
      setErrors({ ...errors, title: "User authentication required" });
      return;
    }

    setLoading(true);

    try {
      const imageUrls = await uploadImages();
      const processedTags = formData.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag !== "");

      const itemData = {
        title: formData.title,
        description: formData.description,
        price: Number(formData.price),
        category:
          ITEM_CATEGORIES[formData.category as keyof typeof ITEM_CATEGORIES],
        tags: processedTags,
        images: imageUrls,
        ...(itemType === "marketplace"
          ? {
              condition:
                ITEM_CONDITIONS[
                  formData.condition as keyof typeof ITEM_CONDITIONS
                ],
            }
          : {}),
      };

      const response = await fetch(`/api/items/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...itemData, type: itemType }),
      });

      if (!response.ok) {
        throw new Error("Failed to create item");
      }

      const result = await response.json();

      toast({
        title: "Success",
        description: `${itemType === "marketplace" ? "Item" : "Commission"} created successfully`,
      });

      router.push(`/item/${itemType}/${result.itemId}`);
    } catch (error) {
      console.error(`Error creating ${itemType} item:`, error);
      toast({
        title: "Error",
        description: `Failed to create ${itemType} item. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    router.push("/dashboard");
  };

  if (!isLoaded) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <Loading />
      </div>
    );
  }

  if (!user && isLoaded) {
    return (
      <div className="flex justify-center items-center h-[80vh]">
        <SignIn />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <Button
        variant="ghost"
        className="mb-6 flex items-center gap-2"
        onClick={handleGoBack}
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Button>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Create {itemType === "marketplace" ? "Marketplace" : "Commission"}{" "}
          Item
        </h1>
        <p className="text-gray-600 mt-2">
          {itemType === "marketplace"
            ? "List an item for sale in your marketplace store"
            : "Create a new commission offering for clients"}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ItemForm
            itemType={itemType}
            loading={loading}
            imageUploading={imageUploading}
            formData={formData}
            errors={errors}
            onChange={handleFormChange}
            onSubmit={handleSubmit}
          />
        </div>

        {/* Right column - Image upload */}
        <div>
          <ImageUpload
            images={images}
            imageUrls={imageUrls}
            imageUploading={imageUploading}
            errors={errors}
            onImageChange={handleImageChange}
            onRemoveNewImage={removeNewImage}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          />
        </div>
      </div>

      {/* Loading overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="p-6 max-w-sm mx-4">
            <div className="flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500 mr-3" />
              <div>
                <p className="font-medium">Creating your item...</p>
                <p className="text-sm text-gray-600">This may take a moment</p>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

"use client";
import React, { useState, useEffect, ChangeEvent, FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SignIn, useUser } from "@clerk/nextjs";
import { getUserByClerkId } from "@/firebase/users";
import { createCommItem } from "@/firebase/commItems";
import { createMPItem } from "@/firebase/mpItems";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { ArrowLeft, Upload, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import Loading from "@/components/utils/Loading";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MPITEM_STATUS,
  ITEM_CATEGORIES,
  ITEM_CONDITIONS,
  ITEM_TYPE,
} from "@/utils/ItemConstants";

export default function CreateItemPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const [itemType, setItemType] = useState<"marketplace" | "commission">(
    "marketplace"
  );
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [imageUploading, setImageUploading] = useState(false);
  const storage = getStorage();

  // Form data states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState<number>(0);
  const [category, setCategory] = useState("");
  const [condition, setCondition] = useState("");
  const [turnaroundDays, setTurnaroundDays] = useState<number>(7);
  const [tags, setTags] = useState("");

  // Form validation errors
  const [errors, setErrors] = useState<{
    title?: string;
    description?: string;
    price?: string;
    category?: string;
    condition?: string;
    turnaroundDays?: string;
    tags?: string;
    images?: string;
  }>({});

  // Set the item type based on the URL parameter
  useEffect(() => {
    const type = searchParams.get("type");
    if (type === "commission" || type === "marketplace") {
      setItemType(type);
    }
  }, [searchParams]);

  // Fetch user data when component mounts
  useEffect(() => {
    const fetchUserData = async () => {
      if (isLoaded && user) {
        try {
          const userData = await getUserByClerkId(user.id);
          if (userData) {
            setUserId(userData.id);
          } else {
            console.error("User data not found");
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      }
    };

    fetchUserData();
  }, [isLoaded, user, router]);

  // Handle file input change
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);

      // Check file types
      const validFiles = newFiles.filter(
        (file) =>
          file.type === "image/jpeg" ||
          file.type === "image/png" ||
          file.type === "image/webp"
      );

      // Check if adding these would exceed the limit
      if (images.length + validFiles.length > 5) {
        setErrors((prev) => ({
          ...prev,
          images: "You can upload a maximum of 5 images",
        }));
        return;
      }

      setImages((prevImages) => [...prevImages, ...validFiles]);
      setErrors((prev) => ({ ...prev, images: undefined }));

      // Generate preview URLs
      validFiles.forEach((file) => {
        const url = URL.createObjectURL(file);
        setImageUrls((prev) => [...prev, url]);
      });
    }
  };

  // Remove an image
  const removeImage = (index: number) => {
    setImages((prevImages) => {
      const newImages = [...prevImages];
      newImages.splice(index, 1);
      return newImages;
    });
    setImageUrls((prevUrls) => {
      const newUrls = [...prevUrls];
      URL.revokeObjectURL(newUrls[index]); // Clean up URL object
      newUrls.splice(index, 1);
      return newUrls;
    });
  };

  // Upload images to Firebase Storage
  const uploadImages = async (): Promise<string[]> => {
    if (images.length === 0) return [];

    setImageUploading(true);
    const uploadPromises = images.map(async (image, index) => {
      const storageRef = ref(
        storage,
        `items/${userId}/${Date.now()}-${index}-${image.name}`
      );
      const snapshot = await uploadBytes(storageRef, image);
      const downloadUrl = await getDownloadURL(snapshot.ref);
      return downloadUrl;
    });

    try {
      const urls = await Promise.all(uploadPromises);
      setImageUploading(false);
      return urls;
    } catch (error) {
      console.error("Error uploading images:", error);
      setImageUploading(false);
      throw error;
    }
  };

  // Validate form input
  const validateForm = () => {
    const newErrors: typeof errors = {};

    if (!title || title.length < 3) {
      newErrors.title = "Title must be at least 3 characters";
    } else if (title.length > 100) {
      newErrors.title = "Title cannot exceed 100 characters";
    }

    if (!description || description.length < 10) {
      newErrors.description = "Description must be at least 10 characters";
    } else if (description.length > 1000) {
      newErrors.description = "Description cannot exceed 1000 characters";
    }

    if (!price || price <= 0) {
      newErrors.price = "Price must be greater than 0";
    }

    if (!category) {
      newErrors.category = "Please select a category";
    }

    if (itemType === "marketplace" && !condition) {
      newErrors.condition = "Please select condition";
    }

    if (itemType === "commission" && (!turnaroundDays || turnaroundDays < 1)) {
      newErrors.turnaroundDays = "Turnaround days must be at least 1";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (!userId) {
      setErrors({ ...errors, title: "User authentication required" });
      return;
    }

    setLoading(true);

    try {
      const imageUrls = await uploadImages();

      // Process tags - split by commas, trim whitespace, remove empty tags
      const processedTags = tags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag !== "");

      if (itemType === "marketplace") {
        const itemData = {
          sellerId: userId,
          title,
          description,
          price: Number(price),
          category: ITEM_CATEGORIES[category as keyof typeof ITEM_CATEGORIES],
          condition: ITEM_CONDITIONS[condition as keyof typeof ITEM_CONDITIONS],
          tags: processedTags,
          status: MPITEM_STATUS.AVAILABLE,
          images: imageUrls,
          createdAt: Date.now(),
        };

        const itemId = await createMPItem(itemData);
        router.push(`/item/${ITEM_TYPE.MARKETPLACE.toLowerCase()}/${itemId}`);
      } else {
        const itemData = {
          sellerId: userId,
          title,
          description,
          price: Number(price),
          category: ITEM_CATEGORIES[category as keyof typeof ITEM_CATEGORIES],
          tags: processedTags,
          turnaroundDays: Number(turnaroundDays),
          isAvailable: true,
          images: imageUrls,
          createdAt: Date.now(),
        };

        const itemId = await createCommItem(itemData);
        router.push(`/item/${ITEM_TYPE.COMMISSION.toLowerCase()}/${itemId}`);
      }
    } catch (error) {
      console.error(`Error creating ${itemType} item:`, error);
      setErrors({ ...errors, title: `Failed to create ${itemType} item` });
    } finally {
      setLoading(false);
    }
  };

  // Go back to shop
  const handleGoBack = () => {
    router.push(`/dashboard`);
  };

  if (!isLoaded) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <Loading />
      </div>
    );
  }

  // Show Sign In if user is not authenticated
  if (!user && isLoaded) {
    return (
      <div className="flex justify-center items-center h-[80vh]">
        <SignIn />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Button
        variant="ghost"
        className="mb-6 flex items-center gap-2"
        onClick={handleGoBack}
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Shop
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
        {/* Left column - Form */}
        <div className="lg:col-span-2">
          <Card className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title Field */}
              <div className="space-y-2">
                <label htmlFor="title" className="text-sm font-medium">
                  Title <span className="text-red-500">*</span>
                </label>
                <Input
                  id="title"
                  placeholder="Enter item title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
                <p className="text-xs text-gray-500">
                  A short, descriptive title for your item (3-100 characters)
                </p>
                {errors.title && (
                  <p className="text-sm font-medium text-red-500">
                    {errors.title}
                  </p>
                )}
              </div>

              {/* Description Field */}
              <div className="space-y-2">
                <label htmlFor="description" className="text-sm font-medium">
                  Description <span className="text-red-500">*</span>
                </label>
                <Textarea
                  id="description"
                  placeholder="Describe your item in detail"
                  className="min-h-32"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
                <p className="text-xs text-gray-500">
                  Include details about materials, size, features, etc. (10-1000
                  characters)
                </p>
                {errors.description && (
                  <p className="text-sm font-medium text-red-500">
                    {errors.description}
                  </p>
                )}
              </div>

              {/* Price and Category in a grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Price Field */}
                <div className="space-y-2">
                  <label htmlFor="price" className="text-sm font-medium">
                    Price ($) <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="price"
                    type="number"
                    min="1"
                    step="0.01"
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    required
                  />
                  {errors.price && (
                    <p className="text-sm font-medium text-red-500">
                      {errors.price}
                    </p>
                  )}
                </div>

                {/* Category Field */}
                <div className="space-y-2">
                  <label htmlFor="category" className="text-sm font-medium">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(ITEM_CATEGORIES).map(([key, value]) => (
                        <SelectItem key={key} value={key}>
                          {value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.category && (
                    <p className="text-sm font-medium text-red-500">
                      {errors.category}
                    </p>
                  )}
                </div>
              </div>

              {/* Condition or Turnaround Days */}
              {itemType === "marketplace" ? (
                <div className="space-y-2">
                  <label htmlFor="condition" className="text-sm font-medium">
                    Condition <span className="text-red-500">*</span>
                  </label>
                  <Select value={condition} onValueChange={setCondition}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select item condition" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(ITEM_CONDITIONS).map(([key, value]) => (
                        <SelectItem key={key} value={key}>
                          {value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.condition && (
                    <p className="text-sm font-medium text-red-500">
                      {errors.condition}
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <label
                    htmlFor="turnaroundDays"
                    className="text-sm font-medium"
                  >
                    Turnaround Time (Days){" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="turnaroundDays"
                    type="number"
                    min="1"
                    value={turnaroundDays}
                    onChange={(e) => setTurnaroundDays(Number(e.target.value))}
                    required
                  />
                  <p className="text-xs text-gray-500">
                    Expected completion time in days
                  </p>
                  {errors.turnaroundDays && (
                    <p className="text-sm font-medium text-red-500">
                      {errors.turnaroundDays}
                    </p>
                  )}
                </div>
              )}

              {/* Tags Field */}
              <div className="space-y-2">
                <label htmlFor="tags" className="text-sm font-medium">
                  Tags
                </label>
                <Input
                  id="tags"
                  placeholder={
                    itemType === "marketplace"
                      ? "art, handmade, vintage, etc."
                      : "portrait, character design, logo, etc."
                  }
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                />
                <p className="text-xs text-gray-500">
                  Separate tags with commas
                </p>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={loading || imageUploading}
              >
                {loading || imageUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating{" "}
                    {itemType === "marketplace" ? "Item" : "Commission"}...
                  </>
                ) : (
                  `Create ${itemType === "marketplace" ? "Item" : "Commission"}`
                )}
              </Button>
            </form>
          </Card>
        </div>

        {/* Right column - Image upload */}
        <div>
          <Card className="p-6">
            <h3 className="text-lg font-medium mb-4">Upload Images</h3>
            <p className="text-sm text-gray-600 mb-4">
              Add up to 5 images of your item. The first image will be used as
              the cover image.
            </p>

            <div className="mb-4">
              <label
                htmlFor="image-upload"
                className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-md cursor-pointer bg-gray-50 hover:bg-gray-100"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="h-6 w-6 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500">
                    <span className="font-medium">Click to upload</span> or drag
                    and drop
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    JPEG, PNG, or WebP (max 5MB each)
                  </p>
                </div>
                <input
                  id="image-upload"
                  type="file"
                  className="hidden"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  onChange={handleImageChange}
                  disabled={images.length >= 5}
                />
              </label>
              {errors.images && (
                <p className="text-sm font-medium text-red-500 mt-2">
                  {errors.images}
                </p>
              )}
            </div>

            {/* Preview area */}
            {imageUrls.length > 0 && (
              <div className="grid grid-cols-2 gap-4 mt-4">
                {imageUrls.map((url, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={url}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-32 object-cover rounded-md"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-4 w-4" />
                    </button>
                    {index === 0 && (
                      <div className="absolute bottom-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                        Cover
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {images.length === 0 && (
              <div className="text-center py-6 text-gray-500 text-sm">
                No images uploaded yet
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

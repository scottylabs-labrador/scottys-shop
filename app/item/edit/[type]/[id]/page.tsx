"use client";
import React, { useState, useEffect, FormEvent } from "react";
import { CommItemWithId } from "@/firebase/commItems";
import { MPItemWithId } from "@/firebase/mpItems";
import { useRouter, useParams } from "next/navigation";
import { useUser, SignIn } from "@clerk/nextjs";
import { getUserByClerkId } from "@/firebase/users";
import { getMPItemById, updateMPItem } from "@/firebase/mpItems";
import { getCommItemById, updateCommItem } from "@/firebase/commItems";
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
import { useToast } from "@/hooks/use-toast";

export default function EditItemPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const { toast } = useToast();
  const [itemType, setItemType] = useState<"marketplace" | "commission">(
    "marketplace"
  );
  const [itemId, setItemId] = useState<string>("");
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [images, setImages] = useState<File[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [currentImageUrls, setCurrentImageUrls] = useState<string[]>([]);
  const [imageUploading, setImageUploading] = useState(false);
  const storage = getStorage();

  // Form data states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState<string>("");
  const [category, setCategory] = useState("");
  const [condition, setCondition] = useState("");
  const [turnaroundDays, setTurnaroundDays] = useState<string>("");
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

  // Extract item type and ID from URL params
  useEffect(() => {
    if (params) {
      // URL structure: /item/edit/:type/:id
      const typeParam = params.type as string;
      const idParam = params.id as string;

      if (typeParam === "marketplace" || typeParam === "commission") {
        setItemType(typeParam);
      }

      if (idParam) {
        setItemId(idParam);
      }
    }
  }, [params]);

  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      if (isLoaded && user) {
        try {
          const userData = await getUserByClerkId(user.id);
          if (userData) {
            setUserId(userData.id);
          } else {
            console.error("Error fetching user data:");
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          toast({
            title: "Error",
            description: "Failed to fetch user data",
            variant: "destructive",
          });
        }
      }
    };

    fetchUserData();
  }, [isLoaded, user, router, toast]);

  // Fetch item data
  useEffect(() => {
    const fetchItemData = async () => {
      if (!itemId || !userId) return;

      setInitialLoading(true);
      try {
        let itemData: MPItemWithId | CommItemWithId | null = null;

        if (itemType === "marketplace") {
          itemData = await getMPItemById(itemId);
        } else {
          itemData = await getCommItemById(itemId);
        }

        if (!itemData) {
          toast({
            title: "Error",
            description: "Item not found",
            variant: "destructive",
          });
          if (isLoaded && user) {
            // Get userData again to access the andrewId
            getUserByClerkId(user.id)
              .then((userData) => {
                if (userData && userData.andrewId) {
                  router.push(`/dashboard`);
                } else {
                  console.error("Error fetching user data:");
                }
              })
              .catch((error) => {
                console.error("Error fetching user data:", error);
              });
          } else {
            console.error("Error fetching user data:");
          }
          return;
        }

        // Verify that user owns this item
        if (itemData.sellerId !== userId) {
          toast({
            title: "Unauthorized",
            description: "You don't have permission to edit this item",
            variant: "destructive",
          });
          if (isLoaded && user) {
            // Get userData again to access the andrewId
            getUserByClerkId(user.id)
              .then((userData) => {
                if (userData && userData.andrewId) {
                  router.push(`/dashboard`);
                } else {
                  console.error("Error fetching user data:");
                }
              })
              .catch((error) => {
                console.error("Error fetching user data:", error);
              });
          } else {
            console.error("Error fetching user data:");
          }
          return;
        }

        // Populate form fields
        setTitle(itemData.title);
        setDescription(itemData.description);
        setPrice(itemData.price ? itemData.price.toString() : "");

        // For category, find the key that maps to the stored value
        const categoryKey =
          Object.entries(ITEM_CATEGORIES).find(
            ([_, value]) => value === itemData.category
          )?.[0] || "";
        setCategory(categoryKey);

        if (itemType === "marketplace" && "condition" in itemData) {
          // Find the key that maps to the stored condition value
          const conditionKey =
            Object.entries(ITEM_CONDITIONS).find(
              ([_, value]) => value === itemData.condition
            )?.[0] || "";
          setCondition(conditionKey);
        } else if ("turnaroundDays" in itemData) {
          setTurnaroundDays(
            itemData.turnaroundDays ? itemData.turnaroundDays.toString() : ""
          );
        }

        // Set tags
        if (itemData.tags && Array.isArray(itemData.tags)) {
          setTags(itemData.tags.join(", "));
        }

        // Set current images
        if (itemData.images && Array.isArray(itemData.images)) {
          setCurrentImageUrls(itemData.images);
        }
      } catch (error) {
        console.error("Error fetching item data:", error);
        toast({
          title: "Error",
          description: "Failed to fetch item data",
          variant: "destructive",
        });
      } finally {
        setInitialLoading(false);
      }
    };

    fetchItemData();
  }, [itemId, itemType, userId, router, toast]);

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
      const totalImages =
        currentImageUrls.length + images.length + validFiles.length;
      if (totalImages > 5) {
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

  // Remove a current image
  const removeCurrentImage = (index: number) => {
    setCurrentImageUrls((prevUrls) => {
      const newUrls = [...prevUrls];
      newUrls.splice(index, 1);
      return newUrls;
    });
  };

  // Remove a new image
  const removeNewImage = (index: number) => {
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

  // Upload new images to Firebase Storage
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

    const numPrice = price ? Number(price) : 0;
    if (!price || numPrice <= 0) {
      newErrors.price = "Price must be greater than 0";
    }

    if (!category) {
      newErrors.category = "Please select a category";
    }

    if (itemType === "marketplace" && !condition) {
      newErrors.condition = "Please select condition";
    }

    const numTurnaroundDays = turnaroundDays ? Number(turnaroundDays) : 0;
    if (
      itemType === "commission" &&
      (!turnaroundDays || numTurnaroundDays < 1)
    ) {
      newErrors.turnaroundDays = "Turnaround days must be at least 1";
    }

    const totalImages = currentImageUrls.length + images.length;
    if (totalImages === 0) {
      newErrors.images = "At least one image is required";
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
      // Upload any new images
      const newImageUrls = await uploadImages();

      // Combine with existing images that weren't removed
      const combinedImageUrls = [...currentImageUrls, ...newImageUrls];

      // Process tags - split by commas, trim whitespace, remove empty tags
      const processedTags = tags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag !== "");

      if (itemType === "marketplace") {
        const itemData = {
          title,
          description,
          price: price === "" ? 0 : Number(price),
          category: ITEM_CATEGORIES[category as keyof typeof ITEM_CATEGORIES], // Get the value from the constant
          condition: ITEM_CONDITIONS[condition as keyof typeof ITEM_CONDITIONS], // Get the value from the constant
          tags: processedTags,
          images: combinedImageUrls,
          updatedAt: Date.now(),
          status: MPITEM_STATUS.AVAILABLE, // Keep current status
          type: ITEM_TYPE.MARKETPLACE, // Explicitly save the item type
        };

        await updateMPItem(itemId, itemData);
      } else {
        const itemData = {
          title,
          description,
          price: price === "" ? 0 : Number(price),
          category: ITEM_CATEGORIES[category as keyof typeof ITEM_CATEGORIES], // Get the value from the constant
          tags: processedTags,
          turnaroundDays: turnaroundDays === "" ? 7 : Number(turnaroundDays),
          images: combinedImageUrls,
          updatedAt: Date.now(),
          isAvailable: true, // Keep current availability
          type: ITEM_TYPE.COMMISSION, // Explicitly save the item type
        };

        await updateCommItem(itemId, itemData);
      }

      toast({
        title: "Success",
        description: "Item updated successfully",
      });

      if (isLoaded && user) {
        // Get userData again to access the andrewId
        getUserByClerkId(user.id)
          .then((userData) => {
            if (userData && userData.andrewId) {
              router.push(`/dashboard`);
            } else {
              console.error("Error fetching user data:");
            }
          })
          .catch((error) => {
            console.error("Error fetching user data:", error);
          });
      } else {
        console.error("Error fetching user data:");
      }
    } catch (error) {
      console.error(`Error updating ${itemType} item:`, error);
      toast({
        title: "Error",
        description: `Failed to update ${itemType} item`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Go back to shop
  const handleGoBack = () => {
    if (isLoaded && user) {
      // Get userData again to access the andrewId
      getUserByClerkId(user.id)
        .then((userData) => {
          if (userData && userData.andrewId) {
            router.push(`/dashboard`);
          } else {
            console.error("Error fetching user data:");
          }
        })
        .catch((error) => {
          console.error("Error fetching user data:", error);
        });
    } else {
      console.error("Error fetching user data:");
    }
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

  if (initialLoading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <Loading />
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
          Edit {itemType === "marketplace" ? "Marketplace" : "Commission"} Item
        </h1>
        <p className="text-gray-600 mt-2">
          Update your{" "}
          {itemType === "marketplace"
            ? "marketplace item"
            : "commission offering"}
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
                    onChange={(e) => setPrice(e.target.value)}
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
                    onChange={(e) => setTurnaroundDays(e.target.value)}
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
                    Updating{" "}
                    {itemType === "marketplace" ? "Item" : "Commission"}...
                  </>
                ) : (
                  `Update ${itemType === "marketplace" ? "Item" : "Commission"}`
                )}
              </Button>
            </form>
          </Card>
        </div>

        {/* Right column - Image upload */}
        <div>
          <Card className="p-6">
            <h3 className="text-lg font-medium mb-4">Item Images</h3>
            <p className="text-sm text-gray-600 mb-4">
              You can have up to 5 images. The first image will be used as the
              cover image.
            </p>

            {/* Current Images */}
            {currentImageUrls.length > 0 && (
              <div className="mb-6">
                <h4 className="text-sm font-medium mb-2">Current Images</h4>
                <div className="grid grid-cols-2 gap-4">
                  {currentImageUrls.map((url, index) => (
                    <div key={`current-${index}`} className="relative group">
                      <img
                        src={url}
                        alt={`Current ${index + 1}`}
                        className="w-full h-32 object-cover rounded-md"
                      />
                      <button
                        type="button"
                        onClick={() => removeCurrentImage(index)}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-4 w-4" />
                      </button>
                      {index === 0 &&
                        currentImageUrls.length + images.length > 1 && (
                          <div className="absolute bottom-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                            Cover
                          </div>
                        )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upload new images */}
            <div className="mb-4">
              <h4 className="text-sm font-medium mb-2">Add New Images</h4>
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
                  disabled={currentImageUrls.length + images.length >= 5}
                />
              </label>
              {errors.images && (
                <p className="text-sm font-medium text-red-500 mt-2">
                  {errors.images}
                </p>
              )}
            </div>

            {/* New image previews */}
            {imageUrls.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">New Images</h4>
                <div className="grid grid-cols-2 gap-4">
                  {imageUrls.map((url, index) => (
                    <div key={`new-${index}`} className="relative group">
                      <img
                        src={url}
                        alt={`New ${index + 1}`}
                        className="w-full h-32 object-cover rounded-md"
                      />
                      <button
                        type="button"
                        onClick={() => removeNewImage(index)}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {currentImageUrls.length === 0 && images.length === 0 && (
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

/**
 * ImageUpload.tsx
 * Component for uploading and managing images in item forms.
 * Supports both new uploads and existing images for editing.
 * Handles drag-and-drop, image previews, and removal of images.
 */
"use client";
import React from "react";
import { Card } from "@/components/ui/card";
import { Upload, X, Loader2 } from "lucide-react";

interface ImageUploadProps {
  images: File[];
  imageUrls: string[];
  currentImageUrls?: string[];
  removedImageUrls?: string[];
  imageUploading: boolean;
  errors?: { images?: string };
  onImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveNewImage: (index: number) => void;
  onRemoveCurrentImage?: (index: number) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
}

export default function ImageUpload({
  images,
  imageUrls,
  currentImageUrls = [],
  removedImageUrls = [],
  imageUploading,
  errors,
  onImageChange,
  onRemoveNewImage,
  onRemoveCurrentImage,
  onDragOver,
  onDrop,
}: ImageUploadProps) {
  const totalImages = currentImageUrls.length + images.length;
  const isEditing = currentImageUrls.length > 0;

  return (
    <Card className="p-6">
      <h3 className="text-lg font-medium mb-4">Item Images</h3>
      <p className="text-sm text-gray-600 mb-4">
        You can have up to 5 images. The first image will be used as the cover
        image.{" "}
        <span className="text-red-500 font-medium">
          At least one image is required.
        </span>
      </p>

      {/* Current Images (for editing) */}
      {isEditing && currentImageUrls.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-medium mb-2">Current Images</h4>
          <div className="grid grid-cols-2 gap-4">
            {currentImageUrls.map((url, index) => (
              <div key={`current-${index}`} className="relative group">
                <img
                  src={url}
                  alt={`Current ${index + 1}`}
                  className="w-full h-32 object-cover rounded-md border"
                />
                {totalImages > 1 && onRemoveCurrentImage && (
                  <button
                    type="button"
                    onClick={() => onRemoveCurrentImage(index)}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                    disabled={totalImages <= 1}
                    title="Remove image"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
                {index === 0 && (
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
        <h4 className="text-sm font-medium mb-2">
          {isEditing ? "Add New Images" : "Upload Images"}
        </h4>
        <label
          htmlFor="image-upload"
          className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-md cursor-pointer transition-colors ${
            totalImages >= 5
              ? "border-gray-200 bg-gray-50 cursor-not-allowed"
              : "border-gray-300 bg-gray-50 hover:bg-gray-100 hover:border-gray-400"
          }`}
          onDragOver={onDragOver}
          onDrop={onDrop}
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <Upload className="h-6 w-6 text-gray-400 mb-2" />
            <p className="text-sm text-gray-500">
              <span className="font-medium">
                {totalImages >= 5
                  ? "Maximum images reached"
                  : "Click to upload"}
              </span>
              {totalImages < 5 && " or drag and drop"}
            </p>
            {totalImages < 5 && (
              <p className="text-xs text-gray-500 mt-1">
                JPEG, PNG, or WebP (max 5MB each)
              </p>
            )}
          </div>
          <input
            id="image-upload"
            type="file"
            className="hidden"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={onImageChange}
            disabled={totalImages >= 5}
          />
        </label>
        {errors?.images && (
          <p className="text-sm font-medium text-red-500 mt-2">
            {errors.images}
          </p>
        )}
      </div>

      {/* New image previews */}
      {imageUrls.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium mb-2">New Images</h4>
          <div className="grid grid-cols-2 gap-4">
            {imageUrls.map((url, index) => (
              <div key={`new-${index}`} className="relative group">
                <img
                  src={url}
                  alt={`New ${index + 1}`}
                  className="w-full h-32 object-cover rounded-md border"
                />
                {totalImages > 1 && (
                  <button
                    type="button"
                    onClick={() => onRemoveNewImage(index)}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                    disabled={totalImages <= 1}
                    title="Remove image"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
                {currentImageUrls.length === 0 && index === 0 && (
                  <div className="absolute bottom-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                    Cover
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Image count indicator */}
      <div className="mt-4 text-xs text-gray-500 text-center">
        {totalImages} of 5 images
      </div>

      {/* No images warning */}
      {totalImages === 0 && (
        <div className="text-center py-6 text-red-500 text-sm font-medium border-2 border-red-200 rounded-md bg-red-50">
          ⚠️ At least one image is required
        </div>
      )}

      {/* Image upload progress */}
      {imageUploading && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <div className="flex items-center">
            <Loader2 className="h-4 w-4 animate-spin text-blue-500 mr-2" />
            <span className="text-sm text-blue-700">Uploading images...</span>
          </div>
        </div>
      )}

      {/* Removed images indicator (for editing) */}
      {removedImageUrls.length > 0 && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-sm text-yellow-700">
            {removedImageUrls.length} image(s) will be deleted when you save.
          </p>
        </div>
      )}

      {/* Tips card */}
      <Card className="p-4 mt-4">
        <h4 className="text-sm font-medium mb-2">Tips for better listings</h4>
        <ul className="text-xs text-gray-600 space-y-1">
          <li>• Use high-quality, well-lit photos</li>
          <li>• Show multiple angles of your item</li>
          <li>• Include close-ups of important details</li>
          <li>• The first image will be your cover photo</li>
          <li>• Use descriptive titles and tags</li>
        </ul>
      </Card>
    </Card>
  );
}

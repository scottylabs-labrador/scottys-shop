/**
 * ItemForm.tsx
 * Form component for creating or editing marketplace items or commissions.
 * Handles input fields, validation, and submission for both create and edit actions.
 * Supports both marketplace items and commission requests with different fields.
 */
"use client";
import React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ITEM_CATEGORIES, ITEM_CONDITIONS } from "@/utils/itemConstants";

interface ItemFormProps {
  itemType: "marketplace" | "commission";
  isEditing?: boolean;
  loading: boolean;
  imageUploading: boolean;
  formData: {
    title: string;
    description: string;
    price: string;
    category: string;
    condition: string;
    tags: string;
  };
  errors: {
    title?: string;
    description?: string;
    price?: string;
    category?: string;
    condition?: string;
    tags?: string;
  };
  onChange: (field: string, value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export default function ItemForm({
  itemType,
  isEditing = false,
  loading,
  imageUploading,
  formData,
  errors,
  onChange,
  onSubmit,
}: ItemFormProps) {
  return (
    <Card className="p-6">
      <form onSubmit={onSubmit} className="space-y-6">
        {/* Title Field */}
        <div className="space-y-2">
          <label htmlFor="title" className="text-sm font-medium">
            Title <span className="text-red-500">*</span>
          </label>
          <Input
            id="title"
            placeholder="Enter item title"
            value={formData.title}
            onChange={(e) => onChange("title", e.target.value)}
            required
            className={errors.title ? "border-red-500" : ""}
          />
          <p className="text-xs text-gray-500">
            A short, descriptive title for your item (3-100 characters)
          </p>
          {errors.title && (
            <p className="text-sm font-medium text-red-500">{errors.title}</p>
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
            className={`min-h-32 ${errors.description ? "border-red-500" : ""}`}
            value={formData.description}
            onChange={(e) => onChange("description", e.target.value)}
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
              min="0.01"
              max="1000000"
              step="0.01"
              value={formData.price}
              onChange={(e) => onChange("price", e.target.value)}
              required
              className={errors.price ? "border-red-500" : ""}
            />
            {errors.price && (
              <p className="text-sm font-medium text-red-500">{errors.price}</p>
            )}
          </div>

          {/* Category Field */}
          <div className="space-y-2">
            <label htmlFor="category" className="text-sm font-medium">
              Category <span className="text-red-500">*</span>
            </label>
            <Select
              value={formData.category}
              onValueChange={(value) => onChange("category", value)}
            >
              <SelectTrigger
                className={errors.category ? "border-red-500" : ""}
              >
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

        {/* Condition field only for marketplace items */}
        {itemType === "marketplace" && (
          <div className="space-y-2">
            <label htmlFor="condition" className="text-sm font-medium">
              Condition <span className="text-red-500">*</span>
            </label>
            <Select
              value={formData.condition}
              onValueChange={(value) => onChange("condition", value)}
            >
              <SelectTrigger
                className={errors.condition ? "border-red-500" : ""}
              >
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
            value={formData.tags}
            onChange={(e) => onChange("tags", e.target.value)}
            className={errors.tags ? "border-red-500" : ""}
          />
          <p className="text-xs text-gray-500">
            Separate tags with commas (max 200 characters)
          </p>
          {errors.tags && (
            <p className="text-sm font-medium text-red-500">{errors.tags}</p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={loading || imageUploading}
        >
          {loading || imageUploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {imageUploading
                ? "Uploading Images..."
                : isEditing
                  ? "Updating Item..."
                  : "Creating Item..."}
            </>
          ) : (
            `${isEditing ? "Update" : "Create"} ${
              itemType === "marketplace" ? "Item" : "Commission"
            }`
          )}
        </Button>
      </form>
    </Card>
  );
}

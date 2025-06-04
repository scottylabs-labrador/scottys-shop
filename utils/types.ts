/** types.ts
 * Shared type definitions used across the application
 * These types provide consistent interfaces for data objects
 */
import { ITEM_STATUS } from "@/utils/itemConstants";

// ID types for type safety
export type ClerkID = string & { readonly __brand: unique symbol };
export type FirebaseID = string & { readonly __brand: unique symbol };
export type AndrewID = string & { readonly __brand: unique symbol };
export type ItemID = string & { readonly __brand: unique symbol };
export type ChatID = string & { readonly __brand: unique symbol };

// Item types
export interface BaseItem {
  id: ItemID;
  sellerId: AndrewID;
  title: string;
  description: string;
  price: number;
  category: string;
  tags: string[];
  images: string[];
  createdAt: number;
}

export interface MarketplaceItem extends BaseItem {
  status: (typeof ITEM_STATUS)[keyof typeof ITEM_STATUS];
  condition: string;
}

export interface CommissionItem extends BaseItem {
  isAvailable: boolean;
}

// Interface for shop items (both marketplace and commission types)
export interface ShopItem {
  id: ItemID;
  type: "MARKETPLACE" | "COMMISSION";
  price: number;
  category: string;
  condition?: string;
}

// User-related types
export interface UserBase {
  username: string;
  email: string;
  avatarUrl?: string;
  andrewId: AndrewID;
  clerkId: ClerkID;
  createdAt: number;
}

export interface User extends UserBase {
  shopBanner?: string;
  shopTitle?: string;
  shopDescription?: string;
  starRating: number;
  paypalUsername?: string;
  venmoUsername?: string;
  zelleUsername?: string;
  cashappUsername?: string;
  favorites: ItemID[];
}

// Safe user data to expose to client
export interface SafeUserData {
  andrewId: AndrewID;
  username: string;
  email: string;
  avatarUrl?: string;
  shopBanner?: string;
  shopTitle?: string;
  shopDescription?: string;
  starRating: number;
  paypalUsername?: string;
  venmoUsername?: string;
  zelleUsername?: string;
  cashappUsername?: string;
  createdAt: number;
}

export interface ShopFormData {
  username: string;
  title: string;
  description: string;
}

// Conversation and messaging types - removed for future implementation

// For combined search results
export interface SearchResult {
  id: ItemID;
  type: "marketplace" | "commission";
  title: string;
  description: string;
  price: number;
  category: string;
  sellerId: AndrewID;
  images: string[];
  createdAt: number;
  // Marketplace specific
  status?: string;
  condition?: string;
  // Commission specific
  isAvailable?: boolean;
  tags: string[];
}

export interface SearchFilters {
  minPrice?: number;
  maxPrice?: number;
  category?: string;
  condition?: string;
  type?: string;
}

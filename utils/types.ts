/**
 * Shared type definitions used across the application
 * These types provide consistent interfaces for data objects
 */

import { ITEM_STATUS } from "./ItemConstants";
import { CONVERSATION_STATUS } from "./ConversationConstants";

// Item types
export interface BaseItem {
  id: string;
  sellerId: string;
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
  turnaroundDays: number;
}

// User-related types
export interface UserBase {
  name: string;
  email: string;
  avatarUrl?: string;
  andrewId: string;
  clerkId: string;
  createdAt: number;
}

export interface User extends UserBase {
  stripeId?: string;
  shopBanner?: string;
  shopTitle?: string;
  shopDescription?: string;
  favorites: string[];
  cart: string[];
  conversations: string[];
}

export interface ShopOwner extends User {
  _id: string; // Compatibility with existing code
}

export interface ShopFormData {
  name: string;
  title: string;
  description: string;
}

// Conversation and messaging types
export interface Message {
  id?: string;
  senderId: string;
  receiverId: string;
  content: string;
  isRead: boolean;
  createdAt: number;
}

export interface Conversation {
  id?: string;
  participants: string[];
  itemId?: string;
  itemType?: string;
  lastMessageTimestamp: number;
  lastMessageText: string;
  lastMessageSenderId: string;
  createdAt: number;
  status: (typeof CONVERSATION_STATUS)[keyof typeof CONVERSATION_STATUS];
}

// For combined search results
export interface SearchResult {
  id: string;
  type: "marketplace" | "commission";
  title: string;
  description: string;
  price: number;
  category: string;
  sellerId: string;
  images: string[];
  createdAt: number;
  // Marketplace specific
  status?: string;
  condition?: string;
  // Commission specific
  turnaroundDays?: number;
  isAvailable?: boolean;
  tags: string[];
}

export interface SearchFilters {
  minPrice?: number;
  maxPrice?: number;
  category?: string;
  condition?: string;
  maxTurnaroundDays?: number;
  type?: string;
}

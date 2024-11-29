import { Doc } from "./_generated/dataModel";

// Marketplace item status constants
export const MPITEM_STATUS = {
  AVAILABLE: "available",
  PENDING: "pending",
  SOLD: "sold",
} as const;

// Transaction status constants
export const TRANSACTION_STATUS = {
  PENDING: "pending",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
  REFUNDED: "refunded",
} as const;

// Category constants
export const ITEM_CATEGORIES = {
  DIGITAL_ART: "Digital Art",
  TRADITIONAL_ART: "Traditional Art",
  THREE_D_MODELS: "3D Models",
  ANIMATIONS: "Animations",
  OTHER: "Other",
} as const;

// Item type constants
export const ITEM_TYPE = {
  COMMISSION: "commission",
  MARKETPLACE: "marketplace",
} as const;

// Type guard functions
export const isMpItemStatus = (status: string): status is MpItemStatus => {
  return Object.values(MPITEM_STATUS).includes(status as MpItemStatus);
};

export const isItemCategory = (category: string): category is ItemCategory => {
  return Object.values(ITEM_CATEGORIES).includes(category as ItemCategory);
};

export const isTransactionStatus = (
  status: string
): status is TransactionStatus => {
  return Object.values(TRANSACTION_STATUS).includes(
    status as TransactionStatus
  );
};

export const isItemType = (type: string): type is ItemType => {
  return Object.values(ITEM_TYPE).includes(type as ItemType);
};

// Create a type from the values
export type TransactionStatus =
  (typeof TRANSACTION_STATUS)[keyof typeof TRANSACTION_STATUS];
export type ItemType = (typeof ITEM_TYPE)[keyof typeof ITEM_TYPE];
export type MpItemStatus = (typeof MPITEM_STATUS)[keyof typeof MPITEM_STATUS];
export type User = Doc<"users">;
export type CommissionItem = Doc<"commItems">;
export type MarketplaceItem = Doc<"mpItems">;
export type Transaction = Doc<"transactions">;
export type AnyItem = CommissionItem | MarketplaceItem;
export type ItemCategory =
  (typeof ITEM_CATEGORIES)[keyof typeof ITEM_CATEGORIES];
// Type guard for distinguishing between item types
export const isCommissionItem = (item: AnyItem): item is CommissionItem => {
  return "turnaroundDays" in item;
};

/**
 * Constants and utilities for item status, types, categories, and conditions
 * Used by both marketplace items and commission items for consistent state management
 */

import { createConstants, createConstantHelpers } from "./constants";

// Item status constants
export const ITEM_STATUS = createConstants({
  AVAILABLE: "Available",
  PENDING: "Pending",
  SOLD: "Sold",
});

// Item type constants
export const ITEM_TYPE = createConstants({
  COMMISSION: "Commission",
  MARKETPLACE: "Marketplace",
});

// Item category constants
export const ITEM_CATEGORIES = createConstants({
  CLOTHING: "Clothing",
  JEWELRY: "Jewelry",
  ART: "Art",
  SHOES: "Shoes",
  OTHER: "Other",
});

// Item condition constants
export const ITEM_CONDITIONS = createConstants({
  NEW: "New",
  LIKE_NEW: "Like New",
  GOOD: "Good",
  FAIR: "Fair",
});

// Helper functions for consistent handling
export const itemStatusHelpers = createConstantHelpers(ITEM_STATUS);
export const itemTypeHelpers = createConstantHelpers(ITEM_TYPE);
export const itemCategoryHelpers = createConstantHelpers(ITEM_CATEGORIES);
export const itemConditionHelpers = createConstantHelpers(ITEM_CONDITIONS);

// Colors for different status values
export const statusColors = {
  [ITEM_STATUS.AVAILABLE]: "bg-green-100 text-green-700",
  [ITEM_STATUS.PENDING]: "bg-yellow-100 text-yellow-700",
  [ITEM_STATUS.SOLD]: "bg-red-100 text-red-700",
};

// Colors for different item types
export const typeColors = {
  [ITEM_TYPE.COMMISSION]: "bg-purple-100 text-purple-700",
  [ITEM_TYPE.MARKETPLACE]: "bg-blue-100 text-blue-700",
};

// Colors for different conditions
export const conditionColors = {
  [ITEM_CONDITIONS.NEW]: "bg-green-100 text-green-700",
  [ITEM_CONDITIONS.LIKE_NEW]: "bg-blue-100 text-blue-700",
  [ITEM_CONDITIONS.GOOD]: "bg-yellow-100 text-yellow-700",
  [ITEM_CONDITIONS.FAIR]: "bg-orange-100 text-orange-700",
};

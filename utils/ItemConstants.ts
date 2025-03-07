export const MPITEM_STATUS = {
  AVAILABLE: "Available",
  PENDING: "Pending",
  SOLD: "Sold",
} as const;

export const ITEM_TYPE = {
  COMMISSION: "Commission",
  MARKETPLACE: "Marketplace",
} as const;

export const ITEM_CATEGORIES = {
  CLOTHING: "Clothing",
  JEWELRY: "Jewelry",
  ART: "Art",
  SHOES: "Shoes",
  OTHER: "Other",
} as const;

export const ITEM_CONDITIONS = {
  NEW: "New",
  LIKE_NEW: "Like New",
  GOOD: "Good",
  FAIR: "Fair",
} as const;

// Helper functions for consistent handling
export const getDisplayText = {
  status: (key: keyof typeof MPITEM_STATUS): string => MPITEM_STATUS[key],
  type: (key: keyof typeof ITEM_TYPE): string => ITEM_TYPE[key],
  category: (key: keyof typeof ITEM_CATEGORIES): string => ITEM_CATEGORIES[key],
  condition: (key: keyof typeof ITEM_CONDITIONS): string =>
    ITEM_CONDITIONS[key],
};

// Get key from value (reverse lookup)
export const getKeyFromValue = {
  status: (value: string): keyof typeof MPITEM_STATUS | undefined => {
    return Object.entries(MPITEM_STATUS).find(
      ([_, val]) => val === value
    )?.[0] as keyof typeof MPITEM_STATUS;
  },
  type: (value: string): keyof typeof ITEM_TYPE | undefined => {
    return Object.entries(ITEM_TYPE).find(
      ([_, val]) => val === value
    )?.[0] as keyof typeof ITEM_TYPE;
  },
  category: (value: string): keyof typeof ITEM_CATEGORIES | undefined => {
    return Object.entries(ITEM_CATEGORIES).find(
      ([_, val]) => val === value
    )?.[0] as keyof typeof ITEM_CATEGORIES;
  },
  condition: (value: string): keyof typeof ITEM_CONDITIONS | undefined => {
    return Object.entries(ITEM_CONDITIONS).find(
      ([_, val]) => val === value
    )?.[0] as keyof typeof ITEM_CONDITIONS;
  },
};

// Colors for different status values
export const statusColors = {
  [MPITEM_STATUS.AVAILABLE]: "bg-green-100 text-green-700",
  [MPITEM_STATUS.PENDING]: "bg-yellow-100 text-yellow-700",
  [MPITEM_STATUS.SOLD]: "bg-red-100 text-red-700",
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

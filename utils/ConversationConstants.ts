// Conversation status constants
export const CONVERSATION_STATUS = {
  ONGOING: "ongoing",
  COMPLETED: "completed",
  BUYER_CANCELLED: "buyercancelled",
  SELLER_CANCELLED: "sellercancelled",
} as const;

// Conversation type constants
export const CONVERSATION_TYPE = {
  DIRECT: "direct", // Direct messaging between users
  ITEM: "item", // Conversation about an item
} as const;

// Message status constants
export const MESSAGE_STATUS = {
  SENT: "sent",
  DELIVERED: "delivered",
  READ: "read",
  FAILED: "failed",
} as const;

// Helper functions for consistent handling
export const getDisplayText = {
  status: (key: keyof typeof CONVERSATION_STATUS): string =>
    CONVERSATION_STATUS[key],
  type: (key: keyof typeof CONVERSATION_TYPE): string => CONVERSATION_TYPE[key],
  messageStatus: (key: keyof typeof MESSAGE_STATUS): string =>
    MESSAGE_STATUS[key],
};

// Get key from value (reverse lookup)
export const getKeyFromValue = {
  status: (value: string): keyof typeof CONVERSATION_STATUS | undefined => {
    return Object.entries(CONVERSATION_STATUS).find(
      ([_, val]) => val === value
    )?.[0] as keyof typeof CONVERSATION_STATUS;
  },
  type: (value: string): keyof typeof CONVERSATION_TYPE | undefined => {
    return Object.entries(CONVERSATION_TYPE).find(
      ([_, val]) => val === value
    )?.[0] as keyof typeof CONVERSATION_TYPE;
  },
  messageStatus: (value: string): keyof typeof MESSAGE_STATUS | undefined => {
    return Object.entries(MESSAGE_STATUS).find(
      ([_, val]) => val === value
    )?.[0] as keyof typeof MESSAGE_STATUS;
  },
};

// Colors for different conversation status values
export const statusColors = {
  [CONVERSATION_STATUS.ONGOING]: "bg-blue-100 text-blue-700",
  [CONVERSATION_STATUS.COMPLETED]: "bg-green-100 text-green-700",
  [CONVERSATION_STATUS.BUYER_CANCELLED]: "bg-red-100 text-red-700",
  [CONVERSATION_STATUS.SELLER_CANCELLED]: "bg-orange-100 text-orange-700",
};

// Colors for different conversation types
export const typeColors = {
  [CONVERSATION_TYPE.DIRECT]: "bg-gray-100 text-gray-700",
  [CONVERSATION_TYPE.ITEM]: "bg-indigo-100 text-indigo-700",
};

// Status badges with descriptive text
export const statusDisplayNames = {
  [CONVERSATION_STATUS.ONGOING]: "Ongoing",
  [CONVERSATION_STATUS.COMPLETED]: "Completed",
  [CONVERSATION_STATUS.BUYER_CANCELLED]: "Cancelled by Buyer",
  [CONVERSATION_STATUS.SELLER_CANCELLED]: "Cancelled by Seller",
};

// Icons for different status values (assuming you use a library like heroicons or similar)
export const statusIcons = {
  [CONVERSATION_STATUS.ONGOING]: "ChatIcon",
  [CONVERSATION_STATUS.COMPLETED]: "CheckCircleIcon",
  [CONVERSATION_STATUS.BUYER_CANCELLED]: "XCircleIcon",
  [CONVERSATION_STATUS.SELLER_CANCELLED]: "XCircleIcon",
};

// Time constants for conversation-related operations (in milliseconds)
export const TIME_CONSTANTS = {
  MESSAGE_DELIVERY_TIMEOUT: 30000, // 30 seconds
  AUTO_READ_TIMEOUT: 5000, // 5 seconds
  TYPING_INDICATOR_TIMEOUT: 3000, // 3 seconds
  REFRESH_INTERVAL: 10000, // 10 seconds
};

/**
 * Constants and utilities for conversation status, types, and message states
 * Provides consistent handling of conversation states throughout the application
 */

import { createConstants, createConstantHelpers } from "./constants";

// Conversation status constants
export const CONVERSATION_STATUS = createConstants({
  ONGOING: "ongoing",
  COMPLETED: "completed",
  BUYER_CANCELLED: "buyercancelled",
  SELLER_CANCELLED: "sellercancelled",
});

// Conversation type constants
export const CONVERSATION_TYPE = createConstants({
  DIRECT: "direct", // Direct messaging between users
  ITEM: "item", // Conversation about an item
});

// Message status constants
export const MESSAGE_STATUS = createConstants({
  SENT: "sent",
  DELIVERED: "delivered",
  READ: "read",
  FAILED: "failed",
});

// Helper functions
export const conversationStatusHelpers =
  createConstantHelpers(CONVERSATION_STATUS);
export const conversationTypeHelpers = createConstantHelpers(CONVERSATION_TYPE);
export const messageStatusHelpers = createConstantHelpers(MESSAGE_STATUS);

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

// Time constants for conversation-related operations (in milliseconds)
export const TIME_CONSTANTS = {
  MESSAGE_DELIVERY_TIMEOUT: 30000, // 30 seconds
  AUTO_READ_TIMEOUT: 5000, // 5 seconds
  TYPING_INDICATOR_TIMEOUT: 3000, // 3 seconds
  REFRESH_INTERVAL: 10000, // 10 seconds
};

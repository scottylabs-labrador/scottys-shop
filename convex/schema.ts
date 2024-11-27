// schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { MPITEM_STATUS, TRANSACTION_STATUS, ITEM_TYPE } from "./constants";

export default defineSchema({
  // Users table - no changes needed
  users: defineTable({
    name: v.string(),
    email: v.string(),
    avatarUrl: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_email", ["email"]),

  // Commission items - no changes needed
  commItems: defineTable({
    sellerId: v.id("users"),
    title: v.string(),
    description: v.string(),
    price: v.number(),
    category: v.string(),
    tags: v.array(v.string()),
    turnaroundDays: v.number(),
    isAvailable: v.boolean(),
    images: v.array(v.string()),
    createdAt: v.number(),
  })
    .index("by_seller", ["sellerId"])
    .index("by_price", ["price"])
    .index("by_category", ["category"])
    .index("by_availability", ["isAvailable"]),

  // Marketplace items - add validation for status
  mpItems: defineTable({
    sellerId: v.id("users"),
    title: v.string(),
    description: v.string(),
    price: v.number(),
    category: v.string(),
    condition: v.string(),
    tags: v.array(v.string()),
    status: v.union(
      v.literal(MPITEM_STATUS.AVAILABLE),
      v.literal(MPITEM_STATUS.PENDING),
      v.literal(MPITEM_STATUS.SOLD)
    ),
    images: v.array(v.string()),
    createdAt: v.number(),
  })
    .index("by_seller", ["sellerId"])
    .index("by_price", ["price"])
    .index("by_category", ["category"])
    .index("by_status", ["status"]),

  // Transactions - add proper validation for itemType and status
  transactions: defineTable({
    buyerId: v.id("users"),
    sellerId: v.id("users"),
    itemType: v.union(
      v.literal(ITEM_TYPE.COMMISSION),
      v.literal(ITEM_TYPE.MARKETPLACE)
    ),
    itemId: v.union(v.id("commItems"), v.id("mpItems")),
    price: v.number(),
    status: v.union(
      v.literal(TRANSACTION_STATUS.PENDING),
      v.literal(TRANSACTION_STATUS.COMPLETED),
      v.literal(TRANSACTION_STATUS.CANCELLED),
      v.literal(TRANSACTION_STATUS.REFUNDED)
    ),
    createdAt: v.number(),
  })
    .index("by_buyer", ["buyerId"])
    .index("by_seller", ["sellerId"])
    .index("by_status", ["status"])
    .index("by_creation_date", ["createdAt"]),
});

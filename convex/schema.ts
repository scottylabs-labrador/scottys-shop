// schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { MPITEM_STATUS, TRANSACTION_STATUS, ITEM_TYPE } from "./constants";

export default defineSchema({
  // User Table
  users: defineTable({
    name: v.string(),
    email: v.string(),
    avatarUrl: v.optional(v.string()),
    andrewId: v.string(),
    clerkId: v.string(),
    shopBanner: v.optional(v.string()),
    shopTitle: v.optional(v.string()),
    shopDescription: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_email", ["email"])
    .index("by_clerk_id", ["clerkId"])
    .index("by_andrew_id", ["andrewId"]),

  // Commission items
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

  // Marketplace items
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

  // Transaction
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

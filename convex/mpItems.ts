import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { MPITEM_STATUS, type MpItemStatus } from "./constants";

// Get marketplace item by ID
export const getById = query({
  args: { itemId: v.id("mpItems") },
  handler: async (ctx, args) => {
    const item = await ctx.db.get(args.itemId);
    if (!item) throw new Error("Item not found");
    return item;
  },
});

// Search marketplace items with optional filters
export const search = query({
  args: {
    status: v.optional(
      v.union(
        v.literal(MPITEM_STATUS.AVAILABLE),
        v.literal(MPITEM_STATUS.PENDING),
        v.literal(MPITEM_STATUS.SOLD)
      )
    ),
    category: v.optional(v.string()),
    minPrice: v.optional(v.number()),
    maxPrice: v.optional(v.number()),
    sellerId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("mpItems").order("desc");

    if (args.status) {
      query = query.filter((q) => q.eq(q.field("status"), args.status));
    }
    if (args.category) {
      query = query.filter((q) => q.eq(q.field("category"), args.category));
    }
    if (args.sellerId) {
      query = query.filter((q) => q.eq(q.field("sellerId"), args.sellerId));
    }

    const items = await query.collect();

    return items.filter((item) => {
      if (args.minPrice !== undefined && item.price < args.minPrice)
        return false;
      if (args.maxPrice !== undefined && item.price > args.maxPrice)
        return false;
      return true;
    });
  },
});

// Create new marketplace item
export const create = mutation({
  args: {
    userId: v.string(), // Clerk user ID
    title: v.string(),
    description: v.string(),
    price: v.number(),
    category: v.string(),
    condition: v.string(),
    tags: v.array(v.string()),
    images: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const { userId, ...itemData } = args;

    // Verify user exists using Clerk ID
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", userId))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const itemId = await ctx.db.insert("mpItems", {
      ...itemData,
      sellerId: user._id,
      status: MPITEM_STATUS.AVAILABLE,
      createdAt: Date.now(),
    });

    return itemId;
  },
});

// Update marketplace item
export const update = mutation({
  args: {
    userId: v.string(), // Clerk user ID
    itemId: v.id("mpItems"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    price: v.optional(v.number()),
    category: v.optional(v.string()),
    condition: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    images: v.optional(v.array(v.string())),
    status: v.optional(
      v.union(
        v.literal(MPITEM_STATUS.AVAILABLE),
        v.literal(MPITEM_STATUS.PENDING),
        v.literal(MPITEM_STATUS.SOLD)
      )
    ),
  },
  handler: async (ctx, args) => {
    const { userId, itemId, ...updates } = args;

    // Verify user exists using Clerk ID
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", userId))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const item = await ctx.db.get(itemId);
    if (!item) throw new Error("Item not found");

    // Check if user owns the item
    if (item.sellerId !== user._id) {
      throw new Error("Unauthorized");
    }

    await ctx.db.patch(itemId, updates);
    return itemId;
  },
});

// Delete marketplace item
export const remove = mutation({
  args: {
    userId: v.string(), // Clerk user ID
    itemId: v.id("mpItems"),
  },
  handler: async (ctx, args) => {
    // Verify user exists using Clerk ID
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.userId))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const item = await ctx.db.get(args.itemId);
    if (!item) throw new Error("Item not found");

    // Check if user owns the item
    if (item.sellerId !== user._id) {
      throw new Error("Unauthorized");
    }

    await ctx.db.delete(args.itemId);
    return args.itemId;
  },
});

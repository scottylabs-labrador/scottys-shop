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

    // Apply filters at the query level when possible
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

    // Apply remaining filters that can't be done at query level
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
    title: v.string(),
    description: v.string(),
    price: v.number(),
    category: v.string(),
    condition: v.string(),
    tags: v.array(v.string()),
    images: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.auth.getUserIdentity();
    if (!user) throw new Error("Not authenticated");

    const userId = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), user.email))
      .unique();
    if (!userId) throw new Error("User not found");

    const itemId = await ctx.db.insert("mpItems", {
      ...args,
      sellerId: userId._id,
      status: MPITEM_STATUS.AVAILABLE,
      createdAt: Date.now(),
    });

    return itemId;
  },
});

// Update marketplace item
export const update = mutation({
  args: {
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
    const { itemId, ...updates } = args;
    const item = await ctx.db.get(itemId);
    if (!item) throw new Error("Item not found");

    const user = await ctx.auth.getUserIdentity();
    if (!user) throw new Error("Not authenticated");

    const userId = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), user.email))
      .unique();
    if (!userId || userId._id !== item.sellerId) {
      throw new Error("Unauthorized");
    }

    await ctx.db.patch(itemId, updates);
    return itemId;
  },
});

// Delete marketplace item
export const remove = mutation({
  args: { itemId: v.id("mpItems") },
  handler: async (ctx, args) => {
    const item = await ctx.db.get(args.itemId);
    if (!item) throw new Error("Item not found");

    const user = await ctx.auth.getUserIdentity();
    if (!user) throw new Error("Not authenticated");

    const userId = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), user.email))
      .unique();
    if (!userId || userId._id !== item.sellerId) {
      throw new Error("Unauthorized");
    }

    await ctx.db.delete(args.itemId);
    return args.itemId;
  },
});

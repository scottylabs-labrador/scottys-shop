import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Get commission item by ID
export const getById = query({
  args: { itemId: v.id("commItems") },
  handler: async (ctx, args) => {
    const item = await ctx.db.get(args.itemId);
    if (!item) throw new Error("Item not found");
    return item;
  },
});

// Search commission items with optional filters
export const search = query({
  args: {
    isAvailable: v.optional(v.boolean()),
    category: v.optional(v.string()),
    minPrice: v.optional(v.number()),
    maxPrice: v.optional(v.number()),
    sellerId: v.optional(v.id("users")),
    maxTurnaroundDays: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("commItems").order("desc");

    if (args.isAvailable !== undefined) {
      query = query.filter((q) =>
        q.eq(q.field("isAvailable"), args.isAvailable)
      );
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
      if (
        args.maxTurnaroundDays !== undefined &&
        item.turnaroundDays > args.maxTurnaroundDays
      )
        return false;
      return true;
    });
  },
});

// Create new commission item
export const create = mutation({
  args: {
    userId: v.string(), // Clerk user ID
    title: v.string(),
    description: v.string(),
    price: v.number(),
    category: v.string(),
    tags: v.array(v.string()),
    turnaroundDays: v.number(),
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

    const itemId = await ctx.db.insert("commItems", {
      ...itemData,
      sellerId: user._id,
      isAvailable: true,
      createdAt: Date.now(),
    });

    return itemId;
  },
});

// Update commission item
export const update = mutation({
  args: {
    userId: v.string(), // Clerk user ID
    itemId: v.id("commItems"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    price: v.optional(v.number()),
    category: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    turnaroundDays: v.optional(v.number()),
    images: v.optional(v.array(v.string())),
    isAvailable: v.optional(v.boolean()),
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

// Delete commission item
export const remove = mutation({
  args: {
    userId: v.string(), // Clerk user ID
    itemId: v.id("commItems"),
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

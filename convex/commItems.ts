import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

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

    // Apply filters at the query level when possible
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

    // Apply remaining filters that can't be done at query level
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
    title: v.string(),
    description: v.string(),
    price: v.number(),
    category: v.string(),
    tags: v.array(v.string()),
    turnaroundDays: v.number(),
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

    const itemId = await ctx.db.insert("commItems", {
      ...args,
      sellerId: userId._id,
      isAvailable: true,
      createdAt: Date.now(),
    });

    return itemId;
  },
});

// Update commission item
export const update = mutation({
  args: {
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

// Delete commission item
export const remove = mutation({
  args: { itemId: v.id("commItems") },
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

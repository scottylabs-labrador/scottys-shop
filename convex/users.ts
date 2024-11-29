import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Helper function to extract Andrew ID
const getAndrewId = (email: string): string => {
  return email.split("@andrew.cmu.edu")[0];
};

// Get user by email
export const getUserByEmail = query({
  args: {
    email: v.string(),
  },
  handler: async (ctx, { email }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();
    return user;
  },
});

// Get user by ID
export const getUserById = query({
  args: {
    id: v.id("users"),
  },
  handler: async (ctx, { id }) => {
    const user = await ctx.db.get(id);
    return user;
  },
});

// Create or update user
export const upsertUser = mutation({
  args: {
    email: v.string(),
    name: v.string(),
    clerkId: v.string(),
    avatarUrl: v.optional(v.string()),
  },
  handler: async (ctx, { email, name, clerkId, avatarUrl }) => {
    // Check if user exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();

    if (existingUser) {
      await ctx.db.patch(existingUser._id, {
        name,
        clerkId,
      });
      return existingUser._id;
    }

    const andrewId = getAndrewId(email);

    const userId = await ctx.db.insert("users", {
      email,
      name,
      avatarUrl,
      clerkId,
      andrewId,
      createdAt: Date.now(),
    });

    return userId;
  },
});

export const getUserByAndrewId = query({
  args: { andrewId: v.string() },
  handler: async (ctx, { andrewId }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_andrew_id", (q) => q.eq("andrewId", andrewId))
      .first();
    return user;
  },
});

export const updateShopSettings = mutation({
  args: {
    userId: v.string(),
    name: v.string(),
    shopTitle: v.string(),
    shopBanner: v.string(),
    shopDescription: v.string(),
    avatarUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.userId))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const updates: any = {
      name: args.name,
      shopTitle: args.shopTitle,
      shopBanner: args.shopBanner,
      shopDescription: args.shopDescription,
    };

    if (args.avatarUrl) {
      updates.avatarUrl = args.avatarUrl;
    }

    await ctx.db.patch(user._id, updates);

    return user;
  },
});

export const getShopItems = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const [commissionItems, marketplaceItems] = await Promise.all([
      ctx.db
        .query("commItems")
        .withIndex("by_seller", (q) => q.eq("sellerId", userId))
        .collect(),
      ctx.db
        .query("mpItems")
        .withIndex("by_seller", (q) => q.eq("sellerId", userId))
        .collect(),
    ]);

    return { commissionItems, marketplaceItems };
  },
});

export const getUserByClerkId = query({
  args: { clerkId: v.string() },
  handler: async (ctx, { clerkId }) => {
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), clerkId))
      .first();
    return user;
  },
});

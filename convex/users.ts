import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Helper function to extract Andrew ID
const getAndrewId = (email: string): string => {
  return email.split("@andrew.cmu.edu")[0];
};

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
      favorites: [],
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

// Add item to favorites
export const addFavorite = mutation({
  args: {
    userId: v.string(),
    itemId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.userId))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    if (!user.favorites.includes(args.itemId)) {
      await ctx.db.patch(user._id, {
        favorites: [...user.favorites, args.itemId],
      });
    }

    return user;
  },
});

// Remove item from favorites
export const removeFavorite = mutation({
  args: {
    userId: v.string(),
    itemId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.userId))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    await ctx.db.patch(user._id, {
      favorites: user.favorites.filter((id) => id !== args.itemId),
    });

    return user;
  },
});

// Check if item is favorited
export const isFavorited = query({
  args: {
    userId: v.string(),
    itemId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.userId))
      .first();

    if (!user) {
      return false;
    }

    return user.favorites.includes(args.itemId);
  },
});

export const getUserFavorites = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    // Get user by Clerk ID
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.userId))
      .first();

    if (!user || user.favorites.length === 0) {
      return [];
    }

    // Split favorites into commission and marketplace IDs
    const commissionIds = user.favorites
      .filter((id) => id.startsWith("comm_"))
      .map((id) => id.split("_")[1]);

    const marketplaceIds = user.favorites
      .filter((id) => id.startsWith("mp_"))
      .map((id) => id.split("_")[1]);

    // Fetch commission items
    const commissionItems = await Promise.all(
      commissionIds.map(async (id) => {
        const item = await ctx.db.get(id as Id<"commItems">);
        return item
          ? {
              ...item,
              type: "commission",
              originalId: `comm_${id}`, // Store original ID for ordering
            }
          : null;
      })
    );

    // Fetch marketplace items
    const marketplaceItems = await Promise.all(
      marketplaceIds.map(async (id) => {
        const item = await ctx.db.get(id as Id<"mpItems">);
        return item
          ? {
              ...item,
              type: "marketplace",
              originalId: `mp_${id}`, // Store original ID for ordering
            }
          : null;
      })
    );

    // Combine and filter out null values
    const allItems = [...commissionItems, ...marketplaceItems].filter(
      (item): item is typeof item & { type: string; originalId: string } =>
        item !== null
    );

    // Sort based on the original favorites array order
    const orderedItems = allItems.sort((a, b) => {
      const aIndex = user.favorites.indexOf(a.originalId);
      const bIndex = user.favorites.indexOf(b.originalId);
      return aIndex - bIndex;
    });

    // Remove the temporary originalId field before returning
    return orderedItems.map(({ originalId, ...item }) => item);
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

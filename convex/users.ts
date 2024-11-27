import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

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
    avatarUrl: v.optional(v.string()),
  },
  handler: async (ctx, { email, name, avatarUrl }) => {
    // Check if user exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();

    if (existingUser) {
      // Update existing user
      await ctx.db.patch(existingUser._id, {
        name,
        avatarUrl,
      });
      return existingUser._id;
    }

    // Create new user
    const userId = await ctx.db.insert("users", {
      email,
      name,
      avatarUrl,
      createdAt: Date.now(),
    });

    return userId;
  },
});

// Update user profile
export const updateUserProfile = mutation({
  args: {
    id: v.id("users"),
    name: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
  },
  handler: async (ctx, { id, name, avatarUrl }) => {
    const user = await ctx.db.get(id);
    if (!user) {
      throw new Error("User not found");
    }

    const updates: Partial<typeof user> = {};
    if (name !== undefined) updates.name = name;
    if (avatarUrl !== undefined) updates.avatarUrl = avatarUrl;

    await ctx.db.patch(id, updates);
    return id;
  },
});

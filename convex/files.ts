import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { query } from "./_generated/server";

// Generate a URL for file upload
export const generateUploadUrl = mutation({
  args: {
    userId: v.string(),
    contentType: v.string(),
  },
  handler: async (ctx, args) => {
    // Verify user exists in database
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.userId))
      .first();

    if (!user) {
      throw new Error("Unauthenticated");
    }

    return await ctx.storage.generateUploadUrl();
  },
});

// Get URL for a single storage ID
export const getUrl = mutation({
  args: {
    storageId: v.string(),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    // Check user authentication
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.userId))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Return if storageId is already a URL
    if (args.storageId.startsWith("http")) {
      return args.storageId;
    }

    try {
      // Parse storageId if it's a JSON string
      const parsedStorageId =
        typeof args.storageId === "string" && args.storageId.startsWith("{")
          ? JSON.parse(args.storageId).storageId
          : args.storageId;

      return await ctx.storage.getUrl(parsedStorageId);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      throw new Error(`Invalid storage ID format: ${errorMessage}`);
    }
  },
});

// Get URLs for multiple storage IDs
export const getStorageUrls = query({
  args: { storageIds: v.array(v.string()) },
  handler: async (ctx, args) => {
    const urls = [];

    for (const storageId of args.storageIds) {
      // Use existing URL if provided
      if (storageId.startsWith("http")) {
        urls.push(storageId);
        continue;
      }

      try {
        // Parse JSON storage ID if needed
        const parsedStorageId = storageId.startsWith("{")
          ? JSON.parse(storageId).storageId
          : storageId;

        const url = await ctx.storage.getUrl(parsedStorageId);
        urls.push(url);
      } catch (e) {
        console.error("Error processing storage ID:", storageId, e);
        urls.push("");
      }
    }

    return urls;
  },
});

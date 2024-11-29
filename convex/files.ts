import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { query } from "./_generated/server";

export const generateUploadUrl = mutation({
  args: {
    userId: v.string(),
    contentType: v.string(),
  },
  handler: async (ctx, args) => {
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

export const getUrl = mutation({
  args: {
    storageId: v.string(),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    // Verify the user exists
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.userId))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // If the storageId is already a URL, return it directly
    if (args.storageId.startsWith("http")) {
      return args.storageId;
    }

    try {
      // Handle case where storageId might be a stringified object
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

export const getStorageUrls = query({
  args: { storageIds: v.array(v.string()) },
  handler: async (ctx, args) => {
    const urls = [];

    for (const storageId of args.storageIds) {
      // If it's already a URL, use it directly
      if (storageId.startsWith("http")) {
        urls.push(storageId);
        continue;
      }

      try {
        // Parse the storage ID if it's a stringified object
        const parsedStorageId = storageId.startsWith("{")
          ? JSON.parse(storageId).storageId
          : storageId;

        // Await each URL resolution
        const url = await ctx.storage.getUrl(parsedStorageId);
        urls.push(url);
      } catch (e) {
        console.error("Error processing storage ID:", storageId, e);
        urls.push(""); // Push empty string for invalid storage IDs
      }
    }

    return urls;
  },
});

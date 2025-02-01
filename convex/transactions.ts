import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { TRANSACTION_STATUS, ITEM_TYPE } from "./constants";

//should transactions also affect MPITEM_STATUS?


// Get transaction by ID
export const getById = query({
  args: { transactionId: v.id("transactions") },
  handler: async (ctx, args) => {
    const transaction = await ctx.db.get(args.transactionId);
    if (!transaction) throw new Error("Transaction not found");
    return transaction;
  },
});

// Get active transaction(s) for the buyer if it exists, possible filter by item
export const getActiveTransaction = query({
  args:{
    buyerId: v.id("users"),
    itemId: v.optional(v.union(
      v.id("mpItems"),
      v.id("commItems")
    )), 
  },
  handler: async (ctx, args) => {
    const trans = await ctx.db.query("transactions")
    .order("desc")
    .filter((q) => 
      q.and(q.and(q.eq(q.field("buyerId"), args.buyerId), q.eq(q.field("itemId"), args.itemId)), 
      q.eq(q.field("status"), TRANSACTION_STATUS.PENDING))
    )
    .collect();
    return trans;
  },
});

// Search transactions with optional filters
export const search = query({
  args: {
    status: v.optional(
      v.union(
        v.literal(TRANSACTION_STATUS.PENDING),
        v.literal(TRANSACTION_STATUS.COMPLETED),
        v.literal(TRANSACTION_STATUS.CANCELLED),
        v.literal(TRANSACTION_STATUS.REFUNDED)
      )
    ),
    buyerId: v.optional(v.id("users")),
    sellerId: v.optional(v.id("users")),
    itemType: v.optional(v.union(
        v.literal(ITEM_TYPE.COMMISSION),
        v.literal(ITEM_TYPE.MARKETPLACE)
      )
    ),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("transactions").order("desc");

    if (args.status) {
      query = query.filter((q) => q.eq(q.field("status"), args.status));
    }
    if (args.buyerId) {
      query = query.filter((q) => q.eq(q.field("buyerId"), args.buyerId));
    }
    if (args.sellerId) {
      query = query.filter((q) => q.eq(q.field("sellerId"), args.sellerId));
    }

    const items = await query.collect();

    return items.filter((item) => {
      if(args.itemType !== undefined && item.itemType !== args.itemType)
        return false;
      return true;
    });
  },
});

// Create new transactionn
export const create = mutation({
  args: {
    userId: v.string(),  // Clerk user ID 
    sellerId: v.id("users"),
    itemType: v.union(
        v.literal(ITEM_TYPE.COMMISSION),
        v.literal(ITEM_TYPE.MARKETPLACE)
    ),
    itemId: v.union(v.id("commItems"), v.id("mpItems")),
    price: v.number(),
  },
  handler: async (ctx, args) => {
    const { userId, sellerId, ...transactionData } = args;

    // Verify user exists using Clerk ID
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", userId))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // User cannot buy their own item/commission
    if (sellerId === user._id) {
        throw new Error("Cannot purchase your own item/commision");
    }

    const transactionId = await ctx.db.insert("transactions", {
      ...transactionData,
      buyerId: user._id,           // user who calls the mutation should become the buyer
      sellerId: sellerId,
      status: TRANSACTION_STATUS.PENDING,
      createdAt: Date.now(),
    });

    return transactionId;
  },
});

// Update transaction (only the status should be changing)
export const update = mutation({
  args: {
    userId: v.string(), // Clerk user ID
    transactionId: v.id("transactions"),
    status: v.optional(
      v.union(
        v.literal(TRANSACTION_STATUS.PENDING),
        v.literal(TRANSACTION_STATUS.COMPLETED),
        v.literal(TRANSACTION_STATUS.CANCELLED),
        v.literal(TRANSACTION_STATUS.REFUNDED)
      )
    ),
  },
  handler: async (ctx, args) => {
    const { userId, transactionId, status } = args;

    // Verify user exists using Clerk ID
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", userId))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const transaction = await ctx.db.get(transactionId);
    if (!transaction) throw new Error("Transaction not found");

    // Check if user is the buyer or seller of the item
    if (transaction.sellerId !== user._id && transaction.buyerId !== user._id) {
      throw new Error("Unauthorized");
    }

    await ctx.db.patch(transactionId, {status});
    return transactionId;
  },
});

// Delete transaction (unsure how we want to handle perms for this yet)
export const remove = mutation({
  args: {
    userId: v.string(), // Clerk user ID
    transactionId: v.id("transactions"),
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

    const transaction = await ctx.db.get(args.transactionId);
    if (!transaction) throw new Error("Transaction not found");

    await ctx.db.delete(args.transactionId);
    return args.transactionId;
  },
});

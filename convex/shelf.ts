import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireAuth } from "./auth";

// List all shelf items
export const list = query({
  args: {},
  handler: async (ctx) => {
    // Get all items
    const allItems = await ctx.db.query("shelfItems").collect();

    // Sort: items with order field first (by order asc), then items without order (by uploadedAt desc)
    const sortedItems = allItems.sort((a, b) => {
      // Both have order - sort by order ascending
      if (a.order !== undefined && b.order !== undefined) {
        return a.order - b.order;
      }
      // Only a has order - a comes first
      if (a.order !== undefined) return -1;
      // Only b has order - b comes first
      if (b.order !== undefined) return 1;
      // Neither has order - sort by uploadedAt descending
      return b.uploadedAt - a.uploadedAt;
    });

    // Get fresh URLs for image items
    const itemsWithUrls = await Promise.all(
      sortedItems.map(async (item) => {
        if (item.type === "image" && item.storageId) {
          return {
            ...item,
            url: await ctx.storage.getUrl(item.storageId),
          };
        }
        return item;
      })
    );
    return itemsWithUrls;
  },
});

// Add a new image
export const addImage = mutation({
  args: {
    token: v.string(),
    storageId: v.string(),
    fileName: v.string(),
    contentType: v.string(),
    caption: v.optional(v.string()),
    aspectRatio: v.number(),
  },
  handler: async (ctx, args) => {
    const isAuthed = await requireAuth(ctx, args.token);
    if (!isAuthed) {
      throw new Error("Unauthorized");
    }

    const storageId = args.storageId as any;
    const url = await ctx.storage.getUrl(storageId);

    const itemId = await ctx.db.insert("shelfItems", {
      type: "image",
      storageId: storageId,
      fileName: args.fileName,
      contentType: args.contentType,
      caption: args.caption,
      aspectRatio: args.aspectRatio,
      url: url || "",
      uploadedAt: Date.now(),
    });

    return { itemId, url: url || "" };
  },
});

// Add a new quote
export const addQuote = mutation({
  args: {
    token: v.string(),
    quoteText: v.string(),
    quoteAuthor: v.optional(v.string()),
    quoteSource: v.optional(v.string()),
    size: v.optional(v.union(v.literal("small"), v.literal("medium"), v.literal("large"))),
    backgroundColor: v.optional(v.string()),
    quoteStyle: v.optional(v.union(v.literal("default"), v.literal("bar"))),
  },
  handler: async (ctx, args) => {
    const isAuthed = await requireAuth(ctx, args.token);
    if (!isAuthed) {
      throw new Error("Unauthorized");
    }

    const itemId = await ctx.db.insert("shelfItems", {
      type: "quote",
      quoteText: args.quoteText,
      quoteAuthor: args.quoteAuthor,
      quoteSource: args.quoteSource,
      size: args.size || "medium",
      backgroundColor: args.backgroundColor,
      quoteStyle: args.quoteStyle || "default",
      uploadedAt: Date.now(),
    });

    return { itemId };
  },
});

// Add a new text item
export const addText = mutation({
  args: {
    token: v.string(),
    textContent: v.string(),
    textLabel: v.optional(v.string()),
    size: v.optional(v.union(v.literal("small"), v.literal("medium"), v.literal("large"))),
    backgroundColor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const isAuthed = await requireAuth(ctx, args.token);
    if (!isAuthed) {
      throw new Error("Unauthorized");
    }

    const itemId = await ctx.db.insert("shelfItems", {
      type: "text",
      textContent: args.textContent,
      textLabel: args.textLabel,
      size: args.size || "small",
      backgroundColor: args.backgroundColor,
      uploadedAt: Date.now(),
    });

    return { itemId };
  },
});

// Update item
export const update = mutation({
  args: {
    token: v.string(),
    id: v.id("shelfItems"),
    caption: v.optional(v.string()),
    quoteText: v.optional(v.string()),
    quoteAuthor: v.optional(v.string()),
    quoteSource: v.optional(v.string()),
    quoteStyle: v.optional(v.union(v.literal("default"), v.literal("bar"))),
    textContent: v.optional(v.string()),
    textLabel: v.optional(v.string()),
    size: v.optional(v.union(v.literal("small"), v.literal("medium"), v.literal("large"))),
    backgroundColor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const isAuthed = await requireAuth(ctx, args.token);
    if (!isAuthed) {
      throw new Error("Unauthorized");
    }

    const { token, id, ...updates } = args;
    // Filter out undefined values
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );

    await ctx.db.patch(id, filteredUpdates);
  },
});

// Delete an item
export const remove = mutation({
  args: {
    token: v.string(),
    id: v.id("shelfItems"),
  },
  handler: async (ctx, args) => {
    const isAuthed = await requireAuth(ctx, args.token);
    if (!isAuthed) {
      throw new Error("Unauthorized");
    }

    const item = await ctx.db.get(args.id);
    if (item) {
      // Delete storage if it's an image
      if (item.type === "image" && item.storageId) {
        await ctx.storage.delete(item.storageId);
      }
      await ctx.db.delete(args.id);
    }
  },
});

// Reorder items (batch update order field)
export const reorder = mutation({
  args: {
    token: v.string(),
    items: v.array(v.object({
      id: v.id("shelfItems"),
      order: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    const isAuthed = await requireAuth(ctx, args.token);
    if (!isAuthed) {
      throw new Error("Unauthorized");
    }

    // Update order for each item
    await Promise.all(
      args.items.map(({ id, order }) =>
        ctx.db.patch(id, { order })
      )
    );
  },
});

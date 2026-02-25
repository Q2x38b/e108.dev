import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Generate an upload URL for the client to upload a file
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

// Get the URL for a stored file
export const getUrl = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});

// Store image metadata after upload
export const saveImage = mutation({
  args: {
    storageId: v.string(),
    fileName: v.string(),
    contentType: v.string(),
  },
  handler: async (ctx, args) => {
    // Cast the string storageId to the proper ID type
    const storageId = args.storageId as any;
    const url = await ctx.storage.getUrl(storageId);
    const imageId = await ctx.db.insert("images", {
      storageId: storageId,
      fileName: args.fileName,
      contentType: args.contentType,
      url: url || "",
      uploadedAt: Date.now(),
    });
    return { imageId, url: url || "" };
  },
});

// List all uploaded images
export const list = query({
  args: {},
  handler: async (ctx) => {
    const images = await ctx.db.query("images").order("desc").collect();
    // Get fresh URLs for all images
    const imagesWithUrls = await Promise.all(
      images.map(async (image) => ({
        ...image,
        url: await ctx.storage.getUrl(image.storageId),
      }))
    );
    return imagesWithUrls;
  },
});

// Delete an image
export const remove = mutation({
  args: { id: v.id("images") },
  handler: async (ctx, args) => {
    const image = await ctx.db.get(args.id);
    if (image) {
      await ctx.storage.delete(image.storageId);
      await ctx.db.delete(args.id);
    }
  },
});

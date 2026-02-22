import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Generate a short random ID (8 characters, alphanumeric)
function generateShortId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export const list = query({
  args: {},
  handler: async (ctx) => {
    const posts = await ctx.db
      .query("posts")
      .withIndex("by_published", (q) => q.eq("published", true))
      .order("desc")
      .collect();
    return posts;
  },
});

export const listAll = query({
  args: {},
  handler: async (ctx) => {
    const posts = await ctx.db.query("posts").order("desc").collect();
    return posts;
  },
});

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const post = await ctx.db
      .query("posts")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();
    return post;
  },
});

export const getByShortId = query({
  args: { shortId: v.string() },
  handler: async (ctx, args) => {
    const post = await ctx.db
      .query("posts")
      .withIndex("by_short_id", (q) => q.eq("shortId", args.shortId))
      .first();
    return post;
  },
});

export const getById = query({
  args: { id: v.id("posts") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    subtitle: v.optional(v.string()),
    slug: v.string(),
    content: v.string(),
    contentJson: v.optional(v.any()), // TipTap JSONContent
    excerpt: v.optional(v.string()),
    titleImage: v.optional(v.string()),
    published: v.boolean(),
    publishedAt: v.optional(v.number()), // Custom publish date
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const shortId = generateShortId();
    return await ctx.db.insert("posts", {
      ...args,
      shortId,
      createdAt: now,
      updatedAt: now,
      publishedAt: args.publishedAt || now,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("posts"),
    title: v.string(),
    subtitle: v.optional(v.string()),
    slug: v.string(),
    content: v.string(),
    contentJson: v.optional(v.any()), // TipTap JSONContent
    excerpt: v.optional(v.string()),
    titleImage: v.optional(v.string()),
    published: v.boolean(),
    publishedAt: v.optional(v.number()), // Custom publish date
  },
  handler: async (ctx, args) => {
    const { id, ...rest } = args;
    await ctx.db.patch(id, {
      ...rest,
      updatedAt: Date.now(),
    });
  },
});

export const remove = mutation({
  args: { id: v.id("posts") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

// Get posts with view counts for sorting
export const listWithViews = query({
  args: {},
  handler: async (ctx) => {
    const posts = await ctx.db
      .query("posts")
      .withIndex("by_published", (q) => q.eq("published", true))
      .collect();

    const postsWithViews = await Promise.all(
      posts.map(async (post) => {
        const views = await ctx.db
          .query("views")
          .withIndex("by_post", (q) => q.eq("postId", post._id))
          .collect();
        return { ...post, viewCount: views.length };
      })
    );

    return postsWithViews;
  },
});

// Migration: Add shortId to existing posts that don't have one
export const migrateAddShortIds = mutation({
  args: {},
  handler: async (ctx) => {
    const posts = await ctx.db.query("posts").collect();
    let migrated = 0;

    for (const post of posts) {
      // Check if post already has a shortId
      if (!post.shortId) {
        await ctx.db.patch(post._id, {
          shortId: generateShortId(),
        });
        migrated++;
      }
    }

    return { migrated, total: posts.length };
  },
});

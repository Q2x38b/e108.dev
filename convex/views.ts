import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const recordView = mutation({
  args: {
    postId: v.id("posts"),
    visitorId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Generate a simple visitor ID if not provided
    const visitorId = args.visitorId || `anon-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    // Check if this visitor already viewed this post today
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;

    const existingView = await ctx.db
      .query("views")
      .withIndex("by_post_visitor", (q) =>
        q.eq("postId", args.postId).eq("visitorId", visitorId)
      )
      .first();

    // Only record if no recent view from this visitor
    if (!existingView || existingView.viewedAt < oneDayAgo) {
      if (existingView) {
        // Update the existing view timestamp
        await ctx.db.patch(existingView._id, { viewedAt: Date.now() });
      } else {
        // Create a new view record
        await ctx.db.insert("views", {
          postId: args.postId,
          visitorId,
          viewedAt: Date.now(),
        });
      }
    }

    return { success: true };
  },
});

export const getViewCount = query({
  args: { postId: v.id("posts") },
  handler: async (ctx, args) => {
    const views = await ctx.db
      .query("views")
      .withIndex("by_post", (q) => q.eq("postId", args.postId))
      .collect();

    return views.length;
  },
});

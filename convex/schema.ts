import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  posts: defineTable({
    title: v.string(),
    subtitle: v.optional(v.string()),
    slug: v.string(),
    shortId: v.optional(v.string()),
    content: v.string(),
    excerpt: v.optional(v.string()),
    titleImage: v.optional(v.string()),
    published: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_slug", ["slug"]).index("by_short_id", ["shortId"]).index("by_published", ["published"]),

  views: defineTable({
    postId: v.id("posts"),
    visitorId: v.string(),
    viewedAt: v.number(),
  }).index("by_post", ["postId"]).index("by_post_visitor", ["postId", "visitorId"]),
});

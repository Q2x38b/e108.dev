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

  // Admin sessions for server-side authentication
  adminSessions: defineTable({
    sessionToken: v.string(),
    createdAt: v.number(),
    expiresAt: v.number(),
  }).index("by_token", ["sessionToken"]),

  // Profile section (singleton)
  profile: defineTable({
    name: v.string(),
    title: v.string(),
    imageUrl: v.string(),
    location: v.string(),
    updatedAt: v.number(),
  }),

  // About section (singleton)
  about: defineTable({
    bio: v.array(v.string()),
    socialLinks: v.array(v.object({
      platform: v.string(),
      url: v.string(),
      label: v.string(),
    })),
    updatedAt: v.number(),
  }),

  // Skills - multiple entries with ordering
  skills: defineTable({
    title: v.string(),
    content: v.string(),
    order: v.number(),
    updatedAt: v.number(),
  }).index("by_order", ["order"]),

  // Projects/Work - multiple entries with ordering
  projects: defineTable({
    name: v.string(),
    description: v.string(),
    year: v.string(),
    details: v.string(),
    tech: v.array(v.string()),
    url: v.optional(v.string()),
    order: v.number(),
    updatedAt: v.number(),
  }).index("by_order", ["order"]),

  // Experiences - multiple entries with ordering
  experiences: defineTable({
    company: v.string(),
    role: v.string(),
    date: v.string(),
    order: v.number(),
    updatedAt: v.number(),
  }).index("by_order", ["order"]),

  // Footer content (singleton)
  footer: defineTable({
    quote: v.string(),
    copyrightYear: v.string(),
    updatedAt: v.number(),
  }),
});

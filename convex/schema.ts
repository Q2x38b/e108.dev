import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  posts: defineTable({
    title: v.string(),
    subtitle: v.optional(v.string()),
    slug: v.string(),
    shortId: v.optional(v.string()),
    content: v.string(),
    contentJson: v.optional(v.any()), // TipTap JSONContent for block editor
    excerpt: v.optional(v.string()),
    titleImage: v.optional(v.string()),
    published: v.boolean(),
    publishedAt: v.optional(v.number()), // Custom publish date (user can override)
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

  // About section (singleton) - socialLinks deprecated, now hardcoded in frontend
  about: defineTable({
    bio: v.array(v.string()),
    socialLinks: v.optional(v.array(v.object({
      platform: v.string(),
      url: v.string(),
      label: v.string(),
    }))),
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
    url: v.optional(v.string()), // deprecated, use links instead
    links: v.optional(v.array(v.object({
      label: v.string(),
      url: v.string(),
    }))),
    images: v.optional(v.array(v.string())), // Array of image URLs
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

  // Uploaded images for blog posts
  images: defineTable({
    storageId: v.id("_storage"),
    fileName: v.string(),
    contentType: v.string(),
    url: v.string(),
    uploadedAt: v.number(),
  }).index("by_uploaded", ["uploadedAt"]),

  // Shelf items for picture collage page (images, quotes, text)
  shelfItems: defineTable({
    type: v.union(v.literal("image"), v.literal("quote"), v.literal("text")),
    // Image fields
    storageId: v.optional(v.id("_storage")),
    fileName: v.optional(v.string()),
    contentType: v.optional(v.string()),
    url: v.optional(v.string()),
    // Quote fields
    quoteText: v.optional(v.string()),
    quoteAuthor: v.optional(v.string()),
    quoteSource: v.optional(v.string()),
    // Text fields
    textContent: v.optional(v.string()),
    textLabel: v.optional(v.string()),
    // Common fields
    caption: v.optional(v.string()),
    aspectRatio: v.optional(v.number()), // width / height for layout calculations
    size: v.optional(v.union(v.literal("small"), v.literal("medium"), v.literal("large"))),
    backgroundColor: v.optional(v.string()),
    order: v.optional(v.number()), // For drag-and-drop ordering
    uploadedAt: v.number(),
  }).index("by_uploaded", ["uploadedAt"]).index("by_order", ["order"]),
});

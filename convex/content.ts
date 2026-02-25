import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireAuth } from "./auth";

// ===== PROFILE =====
export const getProfile = query({
  handler: async (ctx) => {
    return await ctx.db.query("profile").first();
  },
});

export const updateProfile = mutation({
  args: {
    token: v.string(),
    name: v.string(),
    title: v.string(),
    imageUrl: v.string(),
    location: v.string(),
  },
  handler: async (ctx, args) => {
    if (!await requireAuth(ctx, args.token)) {
      throw new Error("Unauthorized");
    }

    const existing = await ctx.db.query("profile").first();
    const data = {
      name: args.name,
      title: args.title,
      imageUrl: args.imageUrl,
      location: args.location,
      updatedAt: Date.now(),
    };

    if (existing) {
      await ctx.db.patch(existing._id, data);
    } else {
      await ctx.db.insert("profile", data);
    }
  },
});

// ===== ABOUT =====
export const getAbout = query({
  handler: async (ctx) => {
    return await ctx.db.query("about").first();
  },
});

export const updateAbout = mutation({
  args: {
    token: v.string(),
    bio: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    if (!await requireAuth(ctx, args.token)) {
      throw new Error("Unauthorized");
    }

    const existing = await ctx.db.query("about").first();
    const data = {
      bio: args.bio,
      updatedAt: Date.now(),
    };

    if (existing) {
      await ctx.db.patch(existing._id, data);
    } else {
      await ctx.db.insert("about", data);
    }
  },
});

// ===== SKILLS =====
export const getSkills = query({
  handler: async (ctx) => {
    return await ctx.db.query("skills").withIndex("by_order").collect();
  },
});

export const updateSkill = mutation({
  args: {
    token: v.string(),
    id: v.id("skills"),
    title: v.string(),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    if (!await requireAuth(ctx, args.token)) {
      throw new Error("Unauthorized");
    }

    await ctx.db.patch(args.id, {
      title: args.title,
      content: args.content,
      updatedAt: Date.now(),
    });
  },
});

export const createSkill = mutation({
  args: {
    token: v.string(),
    title: v.string(),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    if (!await requireAuth(ctx, args.token)) {
      throw new Error("Unauthorized");
    }

    const skills = await ctx.db.query("skills").collect();
    const maxOrder = skills.reduce((max, s) => Math.max(max, s.order), -1);

    await ctx.db.insert("skills", {
      title: args.title,
      content: args.content,
      order: maxOrder + 1,
      updatedAt: Date.now(),
    });
  },
});

export const deleteSkill = mutation({
  args: {
    token: v.string(),
    id: v.id("skills"),
  },
  handler: async (ctx, args) => {
    if (!await requireAuth(ctx, args.token)) {
      throw new Error("Unauthorized");
    }
    await ctx.db.delete(args.id);
  },
});

export const reorderSkills = mutation({
  args: {
    token: v.string(),
    orderedIds: v.array(v.id("skills")),
  },
  handler: async (ctx, args) => {
    if (!await requireAuth(ctx, args.token)) {
      throw new Error("Unauthorized");
    }

    for (let i = 0; i < args.orderedIds.length; i++) {
      await ctx.db.patch(args.orderedIds[i], { order: i });
    }
  },
});

// ===== PROJECTS =====
export const getProjects = query({
  handler: async (ctx) => {
    return await ctx.db.query("projects").withIndex("by_order").collect();
  },
});

export const updateProject = mutation({
  args: {
    token: v.string(),
    id: v.id("projects"),
    name: v.string(),
    description: v.string(),
    year: v.string(),
    details: v.string(),
    tech: v.array(v.string()),
    url: v.optional(v.string()),
    links: v.optional(v.array(v.object({
      label: v.string(),
      url: v.string(),
    }))),
    images: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    if (!await requireAuth(ctx, args.token)) {
      throw new Error("Unauthorized");
    }

    await ctx.db.patch(args.id, {
      name: args.name,
      description: args.description,
      year: args.year,
      details: args.details,
      tech: args.tech,
      updatedAt: Date.now(),
      ...(args.url !== undefined && { url: args.url }),
      ...(args.links !== undefined && { links: args.links }),
      ...(args.images !== undefined && { images: args.images }),
    });
  },
});

export const createProject = mutation({
  args: {
    token: v.string(),
    name: v.string(),
    description: v.string(),
    year: v.string(),
    details: v.string(),
    tech: v.array(v.string()),
    url: v.optional(v.string()),
    links: v.optional(v.array(v.object({
      label: v.string(),
      url: v.string(),
    }))),
    images: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    if (!await requireAuth(ctx, args.token)) {
      throw new Error("Unauthorized");
    }

    const projects = await ctx.db.query("projects").collect();
    const maxOrder = projects.reduce((max, p) => Math.max(max, p.order), -1);

    await ctx.db.insert("projects", {
      name: args.name,
      description: args.description,
      year: args.year,
      details: args.details,
      tech: args.tech,
      order: maxOrder + 1,
      updatedAt: Date.now(),
      ...(args.url !== undefined && { url: args.url }),
      ...(args.links !== undefined && { links: args.links }),
      ...(args.images !== undefined && { images: args.images }),
    });
  },
});

export const deleteProject = mutation({
  args: {
    token: v.string(),
    id: v.id("projects"),
  },
  handler: async (ctx, args) => {
    if (!await requireAuth(ctx, args.token)) {
      throw new Error("Unauthorized");
    }
    await ctx.db.delete(args.id);
  },
});

export const reorderProjects = mutation({
  args: {
    token: v.string(),
    orderedIds: v.array(v.id("projects")),
  },
  handler: async (ctx, args) => {
    if (!await requireAuth(ctx, args.token)) {
      throw new Error("Unauthorized");
    }

    for (let i = 0; i < args.orderedIds.length; i++) {
      await ctx.db.patch(args.orderedIds[i], { order: i });
    }
  },
});

// ===== EXPERIENCES =====
export const getExperiences = query({
  handler: async (ctx) => {
    return await ctx.db.query("experiences").withIndex("by_order").collect();
  },
});

export const updateExperience = mutation({
  args: {
    token: v.string(),
    id: v.id("experiences"),
    company: v.string(),
    role: v.string(),
    date: v.string(),
  },
  handler: async (ctx, args) => {
    if (!await requireAuth(ctx, args.token)) {
      throw new Error("Unauthorized");
    }

    await ctx.db.patch(args.id, {
      company: args.company,
      role: args.role,
      date: args.date,
      updatedAt: Date.now(),
    });
  },
});

export const createExperience = mutation({
  args: {
    token: v.string(),
    company: v.string(),
    role: v.string(),
    date: v.string(),
  },
  handler: async (ctx, args) => {
    if (!await requireAuth(ctx, args.token)) {
      throw new Error("Unauthorized");
    }

    const experiences = await ctx.db.query("experiences").collect();
    const maxOrder = experiences.reduce((max, e) => Math.max(max, e.order), -1);

    await ctx.db.insert("experiences", {
      company: args.company,
      role: args.role,
      date: args.date,
      order: maxOrder + 1,
      updatedAt: Date.now(),
    });
  },
});

export const deleteExperience = mutation({
  args: {
    token: v.string(),
    id: v.id("experiences"),
  },
  handler: async (ctx, args) => {
    if (!await requireAuth(ctx, args.token)) {
      throw new Error("Unauthorized");
    }
    await ctx.db.delete(args.id);
  },
});

export const reorderExperiences = mutation({
  args: {
    token: v.string(),
    orderedIds: v.array(v.id("experiences")),
  },
  handler: async (ctx, args) => {
    if (!await requireAuth(ctx, args.token)) {
      throw new Error("Unauthorized");
    }

    for (let i = 0; i < args.orderedIds.length; i++) {
      await ctx.db.patch(args.orderedIds[i], { order: i });
    }
  },
});

// ===== FOOTER =====
export const getFooter = query({
  handler: async (ctx) => {
    return await ctx.db.query("footer").first();
  },
});

export const updateFooter = mutation({
  args: {
    token: v.string(),
    quote: v.string(),
    copyrightYear: v.string(),
  },
  handler: async (ctx, args) => {
    if (!await requireAuth(ctx, args.token)) {
      throw new Error("Unauthorized");
    }

    const existing = await ctx.db.query("footer").first();
    const data = {
      quote: args.quote,
      copyrightYear: args.copyrightYear,
      updatedAt: Date.now(),
    };

    if (existing) {
      await ctx.db.patch(existing._id, data);
    } else {
      await ctx.db.insert("footer", data);
    }
  },
});

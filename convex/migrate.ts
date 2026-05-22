import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireAuth } from "./auth";

const profileData = {
  name: "Ethan Jerla",
  title: "I build my ideas",
  imageUrl: "/profile.png",
  location: "Houston, TX",
};

const bioData = [
  "I'm a student, athlete, developer, and leader who thrives on collaboration and continuous learning.",
  "When I'm not busy <kbd>designing</kbd> or <kbd>engineering</kbd>, I'm playing sports, traveling, and exploring.",
  "Currently interning at <a href=\"https://cwilsonlaw.com/\" target=\"_blank\" rel=\"noopener noreferrer\">Chad T. Wilson Law</a> while pursuing my <kbd>college goals</kbd>. Driven by a passion for growth and learning, my hobby is to create <kbd>web experiences</kbd> that solve problems and create delightful experiences. Going 0 to 1."
];

const skillsData = [
  { title: "Leadership", content: "Eagle Scout and Senior Patrol Leader leading 50+ scouts. Water polo team captain. PALs Program mentor for 2 years. National Youth Leadership Training graduate." },
  { title: "Athletics", content: "2-time UIL Water Polo State Champion. Southwest Zone Olympic Development Team goalie. All-State tournament team. TISCA All-Region. THSCA Super Elite team." },
  { title: "Academics", content: "10 AP courses including Computer Science, Physics, Economics, and Government. 1st place district science fair. Houston Science Fair qualifier." },
  { title: "Technical", content: "Web development with React, TypeScript, and modern frameworks. Computer programming through AP CS coursework. Microsoft Office proficiency." }
];

const projectsData = [
  {
    name: "Portfolio Website",
    description: "Personal site you're viewing now",
    year: "2026",
    details: "Built this portfolio from scratch with React, TypeScript, and Convex.",
    tech: ["React", "TypeScript", "Convex"],
    url: "#"
  },
  {
    name: "Chad T Wilson Law",
    description: "Legal intern & web development",
    year: "2026",
    details: "Interning at Chad T. Wilson Law while building web tooling for the firm.",
    tech: ["Legal", "Internship", "Web Dev"],
    url: "#"
  },
  {
    name: "Noira Bookmarks",
    description: "An easy minimal bookmark manager",
    year: "2026",
    details: "A clean, minimal bookmark manager built for speed and simplicity.",
    tech: ["React", "TypeScript", "Design"],
    url: "#"
  },
  {
    name: "Eagle Scout Project",
    description: "Community service & leadership",
    year: "2025",
    details: "Restored and improved a ceremonial area at Goforth Elementary. Planned, organized, and led volunteers through the entire project.",
    tech: ["Leadership", "Project Management", "Community Service"],
    url: "#"
  },
  {
    name: "Second Water Polo State Championship",
    description: "UIL 6A State Champions",
    year: "2025",
    details: "Led team as starting goalkeeper to a second consecutive UIL 6A Water Polo State Championship.",
    tech: ["Athletics", "Leadership", "Team"],
    url: "#"
  },
  {
    name: "e108 Bangs",
    description: "Minimal bang search interface",
    year: "2025",
    details: "A lightweight bang search tool that routes queries to your preferred search engine via custom shortcuts.",
    tech: ["React", "TypeScript", "Design"],
    url: "#"
  },
  {
    name: "Noirzen",
    description: "Meticulously crafted theme for VS Code",
    year: "2024",
    details: "A carefully designed dark theme for VS Code with a focus on readability and aesthetics.",
    tech: ["VS Code", "Design", "Open Source"],
    url: "#"
  },
  {
    name: "First Water Polo State Championship",
    description: "UIL 6A State Champions",
    year: "2024",
    details: "Competed as starting goalkeeper in the UIL 6A Water Polo State Championship, bringing home the title.",
    tech: ["Athletics", "Leadership", "Team"],
    url: "#"
  },
  {
    name: "American Rocketry Challenge",
    description: "Top 25 national finish",
    year: "2022",
    details: "Led rocket club team to a top 25 national finish. Invited to the NASA Student Launch Program for exceptional performance.",
    tech: ["Engineering", "Team Lead", "NASA"],
    url: "#"
  }
];

const experiencesData = [
  { company: "Future Goal: UT Austin", role: "Aspiring Law Student", date: "" },
  { company: "Chad T Wilson Law", role: "Legal Internship", date: "2025 - now" },
  { company: "Red River Cantina", role: "Server & ToGo", date: "2024 - now" },
  { company: "Clear Creek High School", role: "Senior", date: "2022 - 2026" }
];

// Seed initial data from hardcoded values
export const seedInitialData = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    if (!await requireAuth(ctx, args.token)) {
      throw new Error("Unauthorized");
    }

    const existingProfile = await ctx.db.query("profile").first();
    if (existingProfile) {
      return { message: "Data already seeded", seeded: false };
    }

    const now = Date.now();

    await ctx.db.insert("profile", { ...profileData, updatedAt: now });
    await ctx.db.insert("about", { bio: bioData, updatedAt: now });

    for (let i = 0; i < skillsData.length; i++) {
      await ctx.db.insert("skills", { ...skillsData[i], order: i, updatedAt: now });
    }

    for (let i = 0; i < projectsData.length; i++) {
      await ctx.db.insert("projects", { ...projectsData[i], order: i, updatedAt: now });
    }

    for (let i = 0; i < experiencesData.length; i++) {
      await ctx.db.insert("experiences", { ...experiencesData[i], order: i, updatedAt: now });
    }

    await ctx.db.insert("footer", {
      quote: "The only limit is yourself",
      copyrightYear: "2025",
      updatedAt: now,
    });

    await ctx.db.insert("latency", {
      title: "Connection Latency",
      description: "Real-time round-trip latency to this server",
      updatedAt: now,
    });

    return { message: "Initial data seeded successfully", seeded: true };
  },
});

// Seed latency data only (for adding to existing databases)
export const seedLatencyData = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("latency").first();
    if (existing) {
      return { message: "Latency data already exists", seeded: false };
    }

    await ctx.db.insert("latency", {
      title: "Connection Latency",
      description: "Real-time round-trip latency to this server",
      updatedAt: Date.now(),
    });

    return { message: "Latency data seeded successfully", seeded: true };
  },
});

// Alternative: Seed without auth (for initial setup only - remove after use)
export const seedInitialDataNoAuth = mutation({
  args: {},
  handler: async (ctx) => {
    const existingProfile = await ctx.db.query("profile").first();
    if (existingProfile) {
      return { message: "Data already seeded", seeded: false };
    }

    const now = Date.now();

    await ctx.db.insert("profile", { ...profileData, updatedAt: now });
    await ctx.db.insert("about", { bio: bioData, updatedAt: now });

    for (let i = 0; i < skillsData.length; i++) {
      await ctx.db.insert("skills", { ...skillsData[i], order: i, updatedAt: now });
    }

    for (let i = 0; i < projectsData.length; i++) {
      await ctx.db.insert("projects", { ...projectsData[i], order: i, updatedAt: now });
    }

    for (let i = 0; i < experiencesData.length; i++) {
      await ctx.db.insert("experiences", { ...experiencesData[i], order: i, updatedAt: now });
    }

    await ctx.db.insert("footer", {
      quote: "The only limit is yourself",
      copyrightYear: "2025",
      updatedAt: now,
    });

    await ctx.db.insert("latency", {
      title: "Connection Latency",
      description: "Real-time round-trip latency to this server",
      updatedAt: now,
    });

    return { message: "Initial data seeded successfully", seeded: true };
  },
});

import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireAuth } from "./auth";

// Seed initial data from hardcoded values
export const seedInitialData = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    // Check auth
    if (!await requireAuth(ctx, args.token)) {
      throw new Error("Unauthorized");
    }

    // Check if data already exists
    const existingProfile = await ctx.db.query("profile").first();
    if (existingProfile) {
      return { message: "Data already seeded", seeded: false };
    }

    const now = Date.now();

    // Seed Profile
    await ctx.db.insert("profile", {
      name: "Ethan Jerla",
      title: "Student • Developer",
      imageUrl: "/profile.png",
      location: "Houston, TX",
      updatedAt: now,
    });

    // Seed About
    await ctx.db.insert("about", {
      bio: [
        "I'm a <kbd>student</kbd>, <kbd>athlete</kbd>, <kbd>developer</kbd>, and <kbd>leader</kbd> who thrives on <em>collaboration</em> and <em>continuous learning</em>. When I'm not busy designing or engineering, I'm playing <kbd>sports</kbd>, traveling, and exploring.",
        "I'm currently working on my future and my <kbd>college goals</kbd>. Driven by a passion for <em>growth</em> and <em>learning</em>, I create <kbd>web experiences</kbd> that solve problems and create <em>delightful experiences</em>."
      ],
      socialLinks: [
        { platform: "github", url: "https://github.com/Q2x38b", label: "GitHub" },
        { platform: "email", url: "mailto:hello@e108.dev", label: "Email" }
      ],
      updatedAt: now,
    });

    // Seed Skills
    const skillsData = [
      { title: "Leadership", content: "Eagle Scout and Senior Patrol Leader leading 50+ scouts. Water polo team captain. PALs Program mentor for 2 years. National Youth Leadership Training graduate." },
      { title: "Athletics", content: "2-time UIL Water Polo State Champion. Southwest Zone Olympic Development Team goalie. All-State tournament team. TISCA All-Region. THSCA Super Elite team." },
      { title: "Academics", content: "10 AP courses including Computer Science, Physics, Economics, and Government. 1st place district science fair. Houston Science Fair qualifier." },
      { title: "Technical", content: "Web development with React, TypeScript, and modern frameworks. Computer programming through AP CS coursework. Microsoft Office proficiency." }
    ];

    for (let i = 0; i < skillsData.length; i++) {
      await ctx.db.insert("skills", {
        ...skillsData[i],
        order: i,
        updatedAt: now,
      });
    }

    // Seed Projects
    const projectsData = [
      {
        name: "Eagle Scout Project",
        description: "Community service & leadership",
        year: "2025",
        details: "Restored and improved a ceremonial area at Goforth Elementary. Planned, organized, and led volunteers through the entire project.",
        tech: ["Leadership", "Project Management", "Community Service"],
        url: "#"
      },
      {
        name: "American Rocketry Challenge",
        description: "Top 25 national finish",
        year: "2022",
        details: "Led rocket club team to a top 25 national finish. Invited to the NASA Student Launch Program for exceptional performance.",
        tech: ["Engineering", "Team Lead", "NASA"],
        url: "#"
      },
      {
        name: "Portfolio Website",
        description: "Personal site you're viewing now",
        year: "2025",
        details: "Built this portfolio from scratch with React, TypeScript..",
        tech: ["React", "TypeScript", "Convex"],
        url: "#"
      },
      {
        name: "Science Fair",
        description: "1st place district • Houston qualifier",
        year: "2022",
        details: "Won first place in division at district science fair and qualified for the Houston Science Fair competition.",
        tech: ["Research", "Presentation", "Analysis"],
        url: "#"
      }
    ];

    for (let i = 0; i < projectsData.length; i++) {
      await ctx.db.insert("projects", {
        ...projectsData[i],
        order: i,
        updatedAt: now,
      });
    }

    // Seed Experiences
    const experiencesData = [
      { company: "Chad T Wilson Law", role: "Legal Intern", date: "2025 - now" },
      { company: "Red River Cantina", role: "Server & ToGo", date: "2024 - now" },
      { company: "Clear Creek High School", role: "Senior", date: "2022 - 2026" },
      { company: "Future: UT Austin", role: "Aspiring Law Student", date: "" }
    ];

    for (let i = 0; i < experiencesData.length; i++) {
      await ctx.db.insert("experiences", {
        ...experiencesData[i],
        order: i,
        updatedAt: now,
      });
    }

    // Seed Footer
    await ctx.db.insert("footer", {
      quote: "The only limit is yourself",
      copyrightYear: "2025",
      updatedAt: now,
    });

    return { message: "Initial data seeded successfully", seeded: true };
  },
});

// Alternative: Seed without auth (for initial setup only - remove after use)
export const seedInitialDataNoAuth = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if data already exists
    const existingProfile = await ctx.db.query("profile").first();
    if (existingProfile) {
      return { message: "Data already seeded", seeded: false };
    }

    const now = Date.now();

    // Seed Profile
    await ctx.db.insert("profile", {
      name: "Ethan Jerla",
      title: "Student • Developer",
      imageUrl: "/profile.png",
      location: "Houston, TX",
      updatedAt: now,
    });

    // Seed About
    await ctx.db.insert("about", {
      bio: [
        "I'm a <kbd>student</kbd>, <kbd>athlete</kbd>, <kbd>developer</kbd>, and <kbd>leader</kbd> who thrives on <em>collaboration</em> and <em>continuous learning</em>. When I'm not busy designing or engineering, I'm playing <kbd>sports</kbd>, traveling, and exploring.",
        "I'm currently working on my future and my <kbd>college goals</kbd>. Driven by a passion for <em>growth</em> and <em>learning</em>, I create <kbd>web experiences</kbd> that solve problems and create <em>delightful experiences</em>."
      ],
      socialLinks: [
        { platform: "github", url: "https://github.com/Q2x38b", label: "GitHub" },
        { platform: "email", url: "mailto:hello@e108.dev", label: "Email" }
      ],
      updatedAt: now,
    });

    // Seed Skills
    const skillsData = [
      { title: "Leadership", content: "Eagle Scout and Senior Patrol Leader leading 50+ scouts. Water polo team captain. PALs Program mentor for 2 years. National Youth Leadership Training graduate." },
      { title: "Athletics", content: "2-time UIL Water Polo State Champion. Southwest Zone Olympic Development Team goalie. All-State tournament team. TISCA All-Region. THSCA Super Elite team." },
      { title: "Academics", content: "10 AP courses including Computer Science, Physics, Economics, and Government. 1st place district science fair. Houston Science Fair qualifier." },
      { title: "Technical", content: "Web development with React, TypeScript, and modern frameworks. Computer programming through AP CS coursework. Microsoft Office proficiency." }
    ];

    for (let i = 0; i < skillsData.length; i++) {
      await ctx.db.insert("skills", {
        ...skillsData[i],
        order: i,
        updatedAt: now,
      });
    }

    // Seed Projects
    const projectsData = [
      {
        name: "Eagle Scout Project",
        description: "Community service & leadership",
        year: "2025",
        details: "Restored and improved a ceremonial area at Goforth Elementary. Planned, organized, and led volunteers through the entire project.",
        tech: ["Leadership", "Project Management", "Community Service"],
        url: "#"
      },
      {
        name: "American Rocketry Challenge",
        description: "Top 25 national finish",
        year: "2022",
        details: "Led rocket club team to a top 25 national finish. Invited to the NASA Student Launch Program for exceptional performance.",
        tech: ["Engineering", "Team Lead", "NASA"],
        url: "#"
      },
      {
        name: "Portfolio Website",
        description: "Personal site you're viewing now",
        year: "2025",
        details: "Built this portfolio from scratch with React, TypeScript..",
        tech: ["React", "TypeScript", "Convex"],
        url: "#"
      },
      {
        name: "Science Fair",
        description: "1st place district • Houston qualifier",
        year: "2022",
        details: "Won first place in division at district science fair and qualified for the Houston Science Fair competition.",
        tech: ["Research", "Presentation", "Analysis"],
        url: "#"
      }
    ];

    for (let i = 0; i < projectsData.length; i++) {
      await ctx.db.insert("projects", {
        ...projectsData[i],
        order: i,
        updatedAt: now,
      });
    }

    // Seed Experiences
    const experiencesData = [
      { company: "Chad T Wilson Law", role: "Legal Intern", date: "2025 - now" },
      { company: "Red River Cantina", role: "Server & ToGo", date: "2024 - now" },
      { company: "Clear Creek High School", role: "Senior", date: "2022 - 2026" },
      { company: "Future: UT Austin", role: "Aspiring Law Student", date: "" }
    ];

    for (let i = 0; i < experiencesData.length; i++) {
      await ctx.db.insert("experiences", {
        ...experiencesData[i],
        order: i,
        updatedAt: now,
      });
    }

    // Seed Footer
    await ctx.db.insert("footer", {
      quote: "The only limit is yourself",
      copyrightYear: "2025",
      updatedAt: now,
    });

    return { message: "Initial data seeded successfully", seeded: true };
  },
});

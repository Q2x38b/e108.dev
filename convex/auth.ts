import { mutation, query, QueryCtx, MutationCtx } from "./_generated/server";
import { v } from "convex/values";

// Generate a secure random token
function generateToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 64; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Create a new session after password validation
export const createSession = mutation({
  args: { password: v.string() },
  handler: async (ctx, args) => {
    const adminPassword = process.env.CONVEX_ADMIN_PASSWORD;

    if (!adminPassword || args.password !== adminPassword) {
      return { success: false, token: null };
    }

    const token = generateToken();
    const now = Date.now();
    const expiresAt = now + 24 * 60 * 60 * 1000; // 24 hours

    await ctx.db.insert("adminSessions", {
      sessionToken: token,
      createdAt: now,
      expiresAt,
    });

    return { success: true, token };
  },
});

// Validate an existing session
export const validateSession = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("adminSessions")
      .withIndex("by_token", (q) => q.eq("sessionToken", args.token))
      .first();

    if (!session) return false;
    if (session.expiresAt < Date.now()) return false;
    return true;
  },
});

// Destroy a session (logout)
export const destroySession = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("adminSessions")
      .withIndex("by_token", (q) => q.eq("sessionToken", args.token))
      .first();

    if (session) {
      await ctx.db.delete(session._id);
    }
  },
});

// Helper function to check auth in mutations - exported for use in other files
export async function requireAuth(ctx: QueryCtx | MutationCtx, token: string | null): Promise<boolean> {
  if (!token) return false;

  const session = await ctx.db
    .query("adminSessions")
    .withIndex("by_token", (q) => q.eq("sessionToken", token))
    .first();

  return session !== null && session.expiresAt >= Date.now();
}

// Clean up expired sessions (can be called periodically)
export const cleanupExpiredSessions = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const sessions = await ctx.db.query("adminSessions").collect();

    let cleaned = 0;
    for (const session of sessions) {
      if (session.expiresAt < now) {
        await ctx.db.delete(session._id);
        cleaned++;
      }
    }

    return { cleaned };
  },
});

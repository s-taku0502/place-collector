import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const add = mutation({
  args: {
    instagramUrl: v.string(),
    title: v.string(),
    memo: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = (await ctx.auth.getUserIdentity())?.subject;
    if (!userId) throw new Error("Unauthorized");

    await ctx.db.insert("places", {
      userId,
      instagramUrl: args.instagramUrl,
      title: args.title,
      memo: args.memo,
      visited: false,
      createdAt: Date.now(),
    });
  },
});

export const list = query({
  args: { visited: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    const userId = (await ctx.auth.getUserIdentity())?.subject;
    if (!userId) return [];

    if (args.visited === undefined) {
      return await ctx.db
        .query("places")
        .withIndex("by_user", q => q.eq("userId", userId))
        .collect();
    }

    return await ctx.db
      .query("places")
      .withIndex("by_user_visited", q =>
        q.eq("userId", userId).eq("visited", args.visited!)

      )
      .collect();
  },
});

export const toggleVisited = mutation({
  args: { id: v.id("places") },
  handler: async (ctx, { id }) => {
    const place = await ctx.db.get(id);
    if (!place) return;

    await ctx.db.patch(id, {
      visited: !place.visited,
    });
  },
});
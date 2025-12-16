import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const add = mutation({
  args: {
    title: v.string(),
    address: v.string(),
    station: v.optional(v.string()),
    genre: v.string(),
    prefecture: v.string(),
    seasons: v.array(v.string()),
    mood: v.string(),
    status: v.string(),
    beforeMemo: v.optional(v.string()),
    beforeUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = (await ctx.auth.getUserIdentity())?.subject;
    if (!userId) throw new Error("Unauthorized");

    await ctx.db.insert("places", {
      userId,
      title: args.title,
      address: args.address,
      station: args.station,
      genre: args.genre,
      prefecture: args.prefecture,
      seasons: args.seasons,
      mood: args.mood,
      status: args.status,
      beforeMemo: args.beforeMemo,
      beforeUrl: args.beforeUrl,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = (await ctx.auth.getUserIdentity())?.subject;
    if (!userId) return [];

    return await ctx.db
      .query("places")
      .withIndex("by_user", q => q.eq("userId", userId))
      .collect();
  },
});

export const listByStatus = query({
  args: { status: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const userId = (await ctx.auth.getUserIdentity())?.subject;
    if (!userId) return [];

    if (!args.status) {
      return await ctx.db
        .query("places")
        .withIndex("by_user", q => q.eq("userId", userId))
        .collect();
    }

    return await ctx.db
      .query("places")
      .withIndex("by_user_status", q => q.eq("userId", userId).eq("status", args.status))
      .collect();
  },
});

export const get = query({
  args: { id: v.id("places") },
  handler: async (ctx, { id }) => {
    const place = await ctx.db.get(id);
    return place ?? null;
  },
});

export const update = mutation({
  args: {
    id: v.id("places"),
    title: v.string(),
    address: v.string(),
    station: v.optional(v.string()),
    genre: v.string(),
    prefecture: v.string(),
    seasons: v.array(v.string()),
    mood: v.string(),
    status: v.string(),
    beforeMemo: v.optional(v.string()),
    beforeUrl: v.optional(v.string()),
    afterMemo: v.optional(v.string()),
    afterUrl: v.optional(v.string()),
    rating: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { id, ...updateData } = args;
    await ctx.db.patch(id, {
      ...updateData,
      updatedAt: Date.now(),
    });
  },
});

// 部分更新用（フォームからの一部フィールド更新に対応）
export const updatePartial = mutation({
  args: {
    id: v.id("places"),
    title: v.optional(v.string()),
    address: v.optional(v.string()),
    station: v.optional(v.string()),
    genre: v.optional(v.string()),
    prefecture: v.optional(v.string()),
    seasons: v.optional(v.array(v.string())),
    mood: v.optional(v.string()),
    status: v.optional(v.string()),
    beforeMemo: v.optional(v.string()),
    beforeUrl: v.optional(v.string()),
    afterMemo: v.optional(v.string()),
    afterUrl: v.optional(v.string()),
    rating: v.optional(v.number()),
    instagramUrl: v.optional(v.string()), // 旧フィールド互換
    memo: v.optional(v.string()), // 旧フィールド互換
  },
  handler: async (ctx, args) => {
    const { id, ...rest } = args;
    // undefined を除外したパッチを作成
    const patch: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(rest)) {
      if (v !== undefined) patch[k] = v;
    }
    await ctx.db.patch(id, { ...patch, updatedAt: Date.now() });
  },
});

export const toggleStatus = mutation({
  args: { id: v.id("places"), status: v.string() },
  handler: async (ctx, { id, status }) => {
    await ctx.db.patch(id, {
      status,
      updatedAt: Date.now(),
    });
  },
});
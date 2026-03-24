import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { auth } from "./auth";

export const add = mutation({
  args: {
    title: v.optional(v.string()),
    address: v.optional(v.string()),
    station: v.optional(v.string()),
    genre: v.optional(v.string()),
    internationalType: v.optional(v.string()),
    region: v.optional(v.string()),
    prefecture: v.optional(v.string()),
    seasons: v.optional(v.array(v.string())),
    mood: v.optional(v.string()),
    status: v.optional(v.string()),
    beforeMemo: v.optional(v.string()),
    beforeUrl: v.optional(v.string()),
    afterMemos: v.optional(
      v.array(
        v.object({
          memo: v.string(),
          url: v.optional(v.string()),
          rating: v.optional(v.number()),
          wantToVisitAgain: v.optional(v.string()),
          createdAt: v.number(),
        })
      )
    ),
    visitedDate: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    // 必須フィールドは空文字デフォルト、optionalはundefinedなら渡さない
    const place = {
      userId,
      title: args.title ?? "",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      address: args.address,
      station: args.station,
      genre: args.genre,
      internationalType: args.internationalType,
      region: args.region,
      prefecture: args.prefecture,
      seasons: args.seasons,
      mood: args.mood,
      status: args.status,
      beforeMemo: args.beforeMemo,
      beforeUrl: args.beforeUrl,
      afterMemos: args.afterMemos,
      visitedDate: args.visitedDate,
    };
    await ctx.db.insert("places", place);
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return [];

    return await getPlacesForUserWithFallback(ctx, userId);
  },
});

/**
 * フォールバック: 複数の ID 形式でデータを検索し、マージして返す
 * 
 * 対応する ID 形式：
 * 1. 現在の userId (j... 形式)
 * 2. identity.subject 全体 (password|j... または password|k... 形式)
 * 3. identity.subject の各部分 (| で分割した各要素)
 * 
 * これにより、ID 形式の遷移期間中でも全てのデータが表示される
 */
async function getPlacesForUserWithFallback(ctx: any, userId: string) {
  const allPlaces = new Map<string, any>();
  const identity = await ctx.auth.getUserIdentity();
  
  // 検索対象のIDを全てリストアップ
  const searchIds = new Set<string>();
  
  // 1. 現在の userId を追加
  if (userId) {
    searchIds.add(userId);
  }
  
  // 2. identity.subject とその分割要素を追加
  if (identity?.subject) {
    searchIds.add(identity.subject);
    
    // "provider|id" 形式の場合、各部分を分解して追加
    // 例: "password|k571hd34wbaedmad69..." → ["password", "k571hd34wbaedmad69..."]
    const parts = identity.subject.split("|");
    parts.forEach(part => {
      if (part && part.trim()) {
        searchIds.add(part);
      }
    });
  }
  
  // 3. 全ての候補IDで検索を実行
  for (const id of searchIds) {
    try {
      const places = await ctx.db
        .query("places")
        .withIndex("by_user", (q: any) => q.eq("userId", id))
        .collect();
      
      places.forEach((p: any) => allPlaces.set(p._id, p));
    } catch (err) {
      // インデックス検索に失敗した場合、フィルター検索にフォールバック
      try {
        const places = await ctx.db
          .query("places")
          .filter((q: any) => q.eq(q.field("userId"), id))
          .collect();
        
        places.forEach((p: any) => allPlaces.set(p._id, p));
      } catch {
        // スキップ
      }
    }
  }
  
  // 全ての ID 形式で見つかったデータをマージして返す
  return Array.from(allPlaces.values());
}

export const listByStatus = query({
  args: { status: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return [];

    if (!args.status) {
      return await getPlacesForUserWithFallback(ctx, userId);
    }

    // 複数の ID 形式でデータを検索し、マージして返す
    const allPlaces = new Map<string, any>();
    const identity = await ctx.auth.getUserIdentity();
    
    // 検索対象のIDを全てリストアップ
    const searchIds = new Set<string>();
    
    if (userId) {
      searchIds.add(userId);
    }
    
    if (identity?.subject) {
      searchIds.add(identity.subject);
      
      const parts = identity.subject.split("|");
      parts.forEach(part => {
        if (part && part.trim()) {
          searchIds.add(part);
        }
      });
    }
    
    // 全ての候補IDで検索を実行
    for (const id of searchIds) {
      try {
        const places = await ctx.db
          .query("places")
          .withIndex("by_user_status", (q: any) => q.eq("userId", id).eq("status", args.status))
          .collect();
        
        places.forEach((p: any) => allPlaces.set(p._id, p));
      } catch (err) {
        // インデックス検索に失敗した場合、フィルター検索にフォールバック
        try {
          const places = await ctx.db
            .query("places")
            .filter((q: any) => q.eq(q.field("userId"), id).eq(q.field("status"), args.status))
            .collect();
          
          places.forEach((p: any) => allPlaces.set(p._id, p));
        } catch {
          // スキップ
        }
      }
    }

    return Array.from(allPlaces.values());
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
    internationalType: v.optional(v.string()),
    region: v.optional(v.string()),
    prefecture: v.optional(v.string()),
    seasons: v.array(v.string()),
    mood: v.string(),
    status: v.string(),
    beforeMemo: v.optional(v.string()),
    beforeUrl: v.optional(v.string()),
    afterMemos: v.optional(
      v.array(
        v.object({
          memo: v.string(),
          url: v.optional(v.string()),
          rating: v.optional(v.number()),
          wantToVisitAgain: v.optional(v.string()),
          createdAt: v.number(),
        })
      )
    ),
    afterMemo: v.optional(v.string()),
    afterUrl: v.optional(v.string()),
    rating: v.optional(v.number()),
    visitedDate: v.optional(v.string()),
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
    internationalType: v.optional(v.string()),
    region: v.optional(v.string()),
    prefecture: v.optional(v.string()),
    seasons: v.optional(v.array(v.string())),
    mood: v.optional(v.string()),
    status: v.optional(v.string()),
    beforeMemo: v.optional(v.string()),
    beforeUrl: v.optional(v.string()),
    afterMemos: v.optional(
      v.array(
        v.object({
          memo: v.string(),
          url: v.optional(v.string()),
          rating: v.optional(v.number()),
          wantToVisitAgain: v.optional(v.string()),
          createdAt: v.number(),
        })
      )
    ),
    afterMemo: v.optional(v.string()),
    afterUrl: v.optional(v.string()),
    rating: v.optional(v.number()),
    instagramUrl: v.optional(v.string()), // 旧フィールド互換
    memo: v.optional(v.string()), // 旧フィールド互換
    visitedDate: v.optional(v.string()),
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

export const addAfterMemo = mutation({
  args: {
    id: v.id("places"),
    memo: v.string(),
    url: v.optional(v.string()),
    rating: v.number(),
    wantToVisitAgain: v.string(),
    visitedDate: v.optional(v.string()),
  },
  handler: async (ctx, { id, memo, url, rating, wantToVisitAgain, visitedDate }) => {
    const place = await ctx.db.get(id);
    if (!place) throw new Error("Not found");

    const createdAt = Date.now();

    const existingMemos = place.afterMemos ?? [];
    const seededMemos =
      existingMemos.length === 0 && place.afterMemo
        ? [
          ...existingMemos,
          {
            memo: place.afterMemo,
            url: place.afterUrl,
            rating: place.rating,
            wantToVisitAgain: undefined,
            createdAt: place.updatedAt ?? place.createdAt ?? createdAt,
            visitedDate: place.visitedDate ?? undefined,
          },
        ]
        : existingMemos;

    await ctx.db.patch(id, {
      afterMemos: [
        ...seededMemos,
        { memo, url, rating, wantToVisitAgain, createdAt, visitedDate },
      ],
      updatedAt: createdAt,
    });
  },
});

export const remove = mutation({
  args: { id: v.id("places") },
  handler: async (ctx, { id }) => {
    const place = await ctx.db.get(id);
    if (!place) throw new Error("Not found");

    const userId = await auth.getUserId(ctx);
    if (!userId || place.userId !== userId) {
      throw new Error("Unauthorized");
    }

    await ctx.db.delete(id);
  },
});

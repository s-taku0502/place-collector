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
 * 本番環境では places.userId に "k...|j..." という連結された形式で保存されているため、
 * 完全一致検索に加えて、フィルターによる部分一致検索（包含チェック）を行う。
 */
async function getPlacesForUserWithFallback(ctx: any, userId: string) {
  const allPlaces = new Map<string, any>();
  const identity = await ctx.auth.getUserIdentity();
  
  // 検索対象のID候補を全てリストアップ
  const searchIds = new Set<string>();
  if (userId) searchIds.add(userId);
  if (identity?.subject) {
    searchIds.add(identity.subject);
    identity.subject.split("|").forEach((part: string) => {
      if (part && part.trim()) searchIds.add(part);
    });
  }
  
  // 1. まずは高速なインデックス検索（完全一致）を実行
  for (const id of searchIds) {
    try {
      const places = await ctx.db
        .query("places")
        .withIndex("by_user", (q: any) => q.eq("userId", id))
        .collect();
      places.forEach((p: any) => allPlaces.set(p._id, p));
    } catch (err) {
      // インデックス検索に失敗した場合はスキップ（後でフィルター検索でカバー）
    }
  }
  
  // 2. 連結された ID 形式 (例: "k...|j...") に対応するため、フィルター検索を実行
  // ログインユーザーの ID (j... や k...) が、保存されている userId に含まれているかチェック
  const allRawPlaces = await ctx.db.query("places").collect();
  allRawPlaces.forEach((p: any) => {
    for (const id of searchIds) {
      if (p.userId === id || p.userId.includes(id)) {
        allPlaces.set(p._id, p);
        break;
      }
    }
  });
  
  return Array.from(allPlaces.values());
}

export const listByStatus = query({
  args: { status: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return [];

    const allUserPlaces = await getPlacesForUserWithFallback(ctx, userId);
    
    if (!args.status) {
      return allUserPlaces;
    }

    // ステータスでフィルタリング
    return allUserPlaces.filter(p => p.status === args.status);
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

    const identity = await ctx.auth.getUserIdentity();
    const userId = await auth.getUserId(ctx);
    
    // 削除権限のチェックを強化（包含チェックを含む）
    const searchIds = new Set<string>();
    if (userId) searchIds.add(userId);
    if (identity?.subject) {
      searchIds.add(identity.subject);
      identity.subject.split("|").forEach(p => searchIds.add(p));
    }

    let isAuthorized = false;
    for (const sid of searchIds) {
      if (place.userId === sid || place.userId.includes(sid)) {
        isAuthorized = true;
        break;
      }
    }

    if (!isAuthorized) {
      throw new Error("Unauthorized");
    }

    await ctx.db.delete(id);
  },
});

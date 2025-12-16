import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  ...authTables,
  places: defineTable({
    userId: v.string(),
    // 基本情報
    title: v.string(), // 名称（必須）
    address: v.optional(v.string()), // 住所（旧データとの互換性のため optional）
    station: v.optional(v.string()), // 最寄り駅（任意）
    // ラベル
    genre: v.optional(v.string()), // ジャンル（旧データとの互換性のため optional）
    prefecture: v.optional(v.string()), // 都道府県（旧データとの互換性のため optional）
    seasons: v.optional(v.array(v.string())), // 季節（複数選択：春、夏、秋、冬、通年）
    mood: v.optional(v.string()), // 気分（ひとり、誰かと、どちらでも）
    status: v.optional(v.string()), // 行動（まだ行ってない、行く予定、行った又行きたい、行ったいいや）
    // メモ
    beforeMemo: v.optional(v.string()), // 行く前のメモ
    beforeUrl: v.optional(v.string()), // InstagramまたはURL（行く前）
    afterMemo: v.optional(v.string()), // 行ったあとのメモ
    afterUrl: v.optional(v.string()), // InstagramまたはURL（行ったあと）
    rating: v.optional(v.number()), // 評価（1-5）
    // 旧フィールド（後方互換性）
    instagramUrl: v.optional(v.string()),
    visited: v.optional(v.boolean()),
    memo: v.optional(v.string()),
    // メタ
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_user_status", ["userId", "status"]),
});

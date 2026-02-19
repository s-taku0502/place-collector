import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  ...authTables,
  userProfiles: defineTable({
    userId: v.string(), // 認証システムのユーザーID
    userIdentifier: v.optional(v.string()), // ユーザーID（重複不可、表示用）
    username: v.optional(v.string()), // ユーザー名（重複可、表示用）
    prefecture: v.optional(v.string()), // 居住地（都道府県）
    isAdmin: v.optional(v.boolean()), // 管理者フラグ
    isSuperAdmin: v.optional(v.boolean()), // 開発者・スーパー管理者フラグ
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
    mustResetPassword: v.optional(v.boolean()),
  })
    .index("by_userId", ["userId"])
    .index("by_userIdentifier", ["userIdentifier"]),  // ユーザーID検索用（このConvexバージョンではDBユニーク制約は未対応）

  resetTable: defineTable({
    email: v.string(),
    createdAt: v.number(),
    status: v.optional(v.string()),
    sentAt: v.optional(v.number()),
    resetToken: v.optional(v.string()),
  })
    .index("by_email", ["email"])
    .index("by_createdAt", ["createdAt"]),

  places: defineTable({
    userId: v.string(),
    // 基本情報
    title: v.string(), // 名称（必須）
    address: v.optional(v.string()), // 住所（旧データとの互換性のため optional）
    station: v.optional(v.string()), // 最寄り駅（任意）
    // ラベル
    genre: v.optional(v.string()), // ジャンル（旧データとの互換性のため optional）
    internationalType: v.optional(v.string()), // 国際区分（日本/海外）
    region: v.optional(v.string()), // 地域（都道府県/国名）
    prefecture: v.optional(v.string()), // 都道府県（旧データとの互換性のため optional）
    seasons: v.optional(v.array(v.string())), // 季節（複数選択：春、夏、秋、冬、通年）
    mood: v.optional(v.string()), // 気分（ひとり、誰かと、どちらでも）
    status: v.optional(v.string()), // 行動（まだ行ってない、行く予定、行った又行きたい、行ったいいや）
    // メモ
    beforeMemo: v.optional(v.string()), // 行く前のメモ
    beforeUrl: v.optional(v.string()), // InstagramまたはURL（行く前）
    afterMemo: v.optional(v.string()), // 行ったあとのメモ
    afterUrl: v.optional(v.string()), // InstagramまたはURL（行ったあと）
    afterMemos: v.optional(
      v.array(
        v.object({
          memo: v.string(),
          url: v.optional(v.string()),
          rating: v.optional(v.number()),
          wantToVisitAgain: v.optional(v.string()),
          createdAt: v.number(),
          visitedDate: v.optional(v.string()), // 追加: afterMemosごとの日付
        })
      )
    ), // 複数の行ったあとのメモ
    rating: v.optional(v.number()), // 評価（1-5）
    // 新フィールド
    visitedDate: v.optional(v.string()), // 行った日付（ISO文字列）
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

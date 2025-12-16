import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  ...authTables,
  places: defineTable({
    userId: v.string(),
    instagramUrl: v.string(),
    title: v.string(),
    memo: v.optional(v.string()),
    visited: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_visited", ["userId", "visited"]),
});

import { query } from "./_generated/server";
import { auth } from "./auth";

/**
 * 現在のユーザーの認証情報を全て出力（デバッグ用）
 */
export const getCurrentUserIdentity = query({
    args: {},
    handler: async (ctx) => {
        try {
            // 認証情報取得
            const identity = await ctx.auth.getUserIdentity();
            const userId = await auth.getUserId(ctx);

            if (!userId) {
                return {
                    authenticated: false,
                    message: "未認証",
                    error: null,
                };
            }

            // places 検索
            const placesForUserId = await ctx.db
                .query("places")
                .withIndex("by_user", (q) => q.eq("userId", userId))
                .collect();

            const placesForIdentSub = identity?.subject
                ? await ctx.db
                    .query("places")
                    .withIndex("by_user", (q) => q.eq("userId", identity.subject))
                    .collect()
                : [];

            // 全 places を集計
            const allPlaces = await ctx.db.query("places").collect();
            const uniqueUserIds = Array.from(new Set(allPlaces.map((p) => p.userId))).sort();

            return {
                authenticated: true,
                identity_subject: identity?.subject || "",
                identity_email: identity?.email || "",
                auth_userId: userId || "",
                places_count_for_userId: placesForUserId.length,
                places_count_for_identity_subject: placesForIdentSub.length,
                total_places_in_db: allPlaces.length,
                unique_user_ids: uniqueUserIds,
                error: null,
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            return {
                authenticated: false,
                message: "エラーが発生しました",
                error: errorMessage,
                error_stack: error instanceof Error ? error.stack : null,
            };
        }
    },
});

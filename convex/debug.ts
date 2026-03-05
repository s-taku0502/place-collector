import { query } from "./_generated/server";
import { auth } from "./auth";

/**
 * 現在のユーザーの認証情報を全て出力（デバッグ用）
 * JWT sub、auth.getUserId()の値、places のマッチング状況を確認できます
 */
export const getCurrentUserIdentity = query({
    args: {},
    handler: async (ctx): Promise<Record<string, any>> => {
        // 方法1: identity オブジェクト（JWT デコード結果）
        const identity = await ctx.auth.getUserIdentity();

        // 方法2: auth.getUserId() の結果
        const userId = await auth.getUserId(ctx);

        if (!userId) {
            return {
                authenticated: false,
                message: "未認証",
            };
        }

        // 方法3: auth テーブルで userId を直接検索
        const authUser = await ctx.db
            .query("users")
            .filter((q) => q.eq(q.field("_id"), userId))
            .first();

        // 方法4: places テーブルで userId で検索
        const placesForUserId = await ctx.db
            .query("places")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .collect();

        // 方法5: places テーブルで identity.subject で検索（フォールバック用）
        const placesForIdentSub = identity?.subject
            ? await ctx.db
                .query("places")
                .withIndex("by_user", (q) => q.eq("userId", identity.subject))
                .collect()
            : [];

        // 方法6: places テーブルの全ユーザーID一覧（デバッグ用）
        const allPlaces = await ctx.db.query("places").collect();
        const uniqueUserIds = Array.from(new Set(allPlaces.map((p) => p.userId)));

        const result: Record<string, any> = {
            authenticated: true,
            identity: {
                subject: identity?.subject || null,
                email: identity?.email || null,
                emailVerified: identity?.emailVerified || false,
                givenName: identity?.givenName || null,
                familyName: identity?.familyName || null,
                picture: identity?.picture || null,
                issuer: identity?.issuer || null,
                orgId: identity?.orgId || null,
                tokenIdentifier: identity?.tokenIdentifier || null,
                allKeys: Object.keys(identity || {}),
            },
            auth: {
                userId: userId || null,
                userType: typeof userId,
            },
            authUser: authUser ? { _id: authUser._id, email: authUser.email || null } : null,
            places: {
                countForUserId: placesForUserId.length,
                countForIdentSubject: placesForIdentSub.length,
                samplesForUserId: placesForUserId.slice(0, 3).map((p) => ({
                    _id: p._id,
                    title: p.title,
                })),
                samplesForIdentSubject: placesForIdentSub.slice(0, 3).map((p) => ({
                    _id: p._id,
                    title: p.title,
                })),
            },
            database: {
                totalPlacesInDB: allPlaces.length,
                uniqueUserIds: uniqueUserIds.sort(),
            },
        };

        return result;
    },
});

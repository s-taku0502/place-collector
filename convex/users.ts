import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { auth } from "./auth";

// 現在のユーザー情報を取得
export const getCurrentUser = query({
    args: {},
    handler: async (ctx) => {
        const userId = await auth.getUserId(ctx);
        if (!userId) {
            return null;
        }

        // authテーブル（users）からメールアドレスを取得
        const authUser = await ctx.db
            .query("users")
            .filter((q) => q.eq(q.field("_id"), userId))
            .first();

        // userProfilesテーブルからプロフィール情報を取得
        const userProfile = await ctx.db
            .query("userProfiles")
            .withIndex("by_userId", (q) => q.eq("userId", userId))
            .first();

        return {
            userId,
            email: authUser?.email,
            userIdentifier: userProfile?.userIdentifier,
            username: userProfile?.username,
            prefecture: userProfile?.prefecture,
            profileId: userProfile?._id,
        };
    },
});

// ユーザープロフィールを更新
export const updateUserProfile = mutation({
    args: {
        userIdentifier: v.optional(v.string()),
        username: v.optional(v.string()),
        prefecture: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const userId = await auth.getUserId(ctx);
        if (!userId) {
            throw new Error("認証が必要です");
        }

        // 既存のプロフィールを検索
        // userIdentifierが指定されている場合、重複チェック
        const existingProfile = await ctx.db
            .query("userProfiles")
            .withIndex("by_userId", (q) => q.eq("userId", userId))
            .first();

        // すでに設定済みのユーザーIDがある場合は変更不可
        if (
            existingProfile?.userIdentifier &&
            args.userIdentifier &&
            args.userIdentifier !== existingProfile.userIdentifier
        ) {
            throw new Error("ユーザーIDは一度だけ設定できます（変更不可）");
        }

        if (args.userIdentifier) {
            const duplicate = await ctx.db
                .query("userProfiles")
                .withIndex("by_userIdentifier", (q) => 
                    q.eq("userIdentifier", args.userIdentifier)
                )
                .first();
            
            // 他のユーザーが既に使用しているかチェック
            if (duplicate && duplicate.userId !== userId) {
                throw new Error("このユーザーIDは既に使用されています");
            }
        }

        if (existingProfile) {
            // 既存のプロフィールを更新
            await ctx.db.patch(existingProfile._id, {
                ...args,
                updatedAt: Date.now(),
            });
        } else {
            // 新規プロフィールを作成
            await ctx.db.insert("userProfiles", {
                userId,
                ...args,
                createdAt: Date.now(),
            });
        }

        return { success: true };
    },
});

// メールアドレスを変更（@convex-dev/authのPassword providerを使用）
export const updateEmail = mutation({
    args: {
        newEmail: v.string(),
        password: v.string(),
    },
    handler: async (ctx) => {
        const userId = await auth.getUserId(ctx);
        if (!userId) {
            throw new Error("認証が必要です");
        }

        // Note: @convex-dev/authのPassword providerはメールアドレス変更機能を
        // 直接提供していないため、この実装は制限があります
        // 実際の実装では、authテーブルのemailフィールドを更新する必要がありますが、
        // これはセキュリティ上の理由から慎重に扱う必要があります

        throw new Error(
            "メールアドレスの変更はまだ実装されていません。管理者にお問い合わせください。"
        );
    },
});

// パスワードを変更（@convex-dev/authのPassword providerを使用）
export const updatePassword = mutation({
    args: {
        currentPassword: v.string(),
        newPassword: v.string(),
    },
    handler: async (ctx) => {
        const userId = await auth.getUserId(ctx);
        if (!userId) {
            throw new Error("認証が必要です");
        }

        // Note: @convex-dev/authのPassword providerはパスワード変更機能を
        // 直接提供していないため、この実装は制限があります
        // 実際の実装では、現在のパスワードを検証し、新しいパスワードをハッシュ化して
        // authテーブルを更新する必要があります

        throw new Error(
            "パスワードの変更はまだ実装されていません。管理者にお問い合わせください。"
        );
    },
});

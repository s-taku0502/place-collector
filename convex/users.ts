import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { auth } from "./auth";
import { validateUserIdentifier } from "../lib/ng_list";

// ユーザーIDの重複を事前にチェック
export const assertUserIdentifierAvailable = mutation({
    args: {
        userIdentifier: v.string(),
    },
    handler: async (ctx, args) => {
        const trimmed = args.userIdentifier.trim();
        if (trimmed.length === 0) {
            throw new Error("ユーザーIDは空にできません");
        }

        const validation = validateUserIdentifier(trimmed);
        if (!validation.valid) {
            throw new Error(validation.reason || "このユーザーIDは設定できません");
        }

        const duplicate = await ctx.db
            .query("userProfiles")
            .withIndex("by_userIdentifier", (q) =>
                q.eq("userIdentifier", trimmed)
            )
            .first();

        if (duplicate) {
            throw new Error("このユーザーIDは既に使用されています");
        }

        return { ok: true };
    },
});

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
            isAdmin: userProfile?.isAdmin ?? false,
            isSuperAdmin: userProfile?.isSuperAdmin ?? false,
            mustResetPassword: userProfile?.mustResetPassword ?? false,
        };
    },
});

// メールアドレスの存在確認（パスワード再設定用）
export const checkEmailExists = query({
    args: {
        email: v.string(),
    },
    handler: async (ctx, args) => {
        const trimmed = args.email.trim();
        if (trimmed.length === 0) {
            return { exists: false };
        }

        const user = await ctx.db
            .query("users")
            .filter((q) => q.eq(q.field("email"), trimmed))
            .first();

        return { exists: Boolean(user) };
    },
});

// パスワード再設定の申請を記録
export const requestPasswordReset = mutation({
    args: {
        email: v.string(),
    },
    handler: async (ctx, args) => {
        const trimmed = args.email.trim();
        if (trimmed.length === 0) {
            throw new Error("メールアドレスを入力してください。");
        }

        const user = await ctx.db
            .query("users")
            .filter((q) => q.eq(q.field("email"), trimmed))
            .first();

        if (!user) {
            return { exists: false, requested: false };
        }

        await ctx.db.insert("resetTable", {
            email: trimmed,
            createdAt: Date.now(),
            status: "pending",
        });

        return { exists: true, requested: true };
    },
});

// パスワード再設定の申請一覧（管理者用）
export const listPasswordResetRequests = query({
    args: {},
    handler: async (ctx) => {
        return ctx.db
            .query("resetTable")
            .withIndex("by_createdAt")
            .order("desc")
            .collect();
    },
});

// 再設定メール送信済みとしてトークンを発行（管理者用）
export const issuePasswordResetToken = mutation({
    args: {
        resetId: v.id("resetTable"),
    },
    handler: async (ctx, args) => {
        const reset = await ctx.db.get(args.resetId);
        if (!reset) {
            throw new Error("申請データが見つかりません。");
        }

        const token = globalThis.crypto?.randomUUID
            ? globalThis.crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

        await ctx.db.patch(args.resetId, {
            status: "sent",
            sentAt: Date.now(),
            resetToken: token,
        });

        return { token };
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

        // 空文字や空白のみのユーザーIDを禁止
        if (args.userIdentifier !== undefined && args.userIdentifier.trim().length === 0) {
            throw new Error("ユーザーIDは空にできません");
        }

        // 禁止ユーザーID一覧をチェック
        if (args.userIdentifier) {
            const validation = validateUserIdentifier(args.userIdentifier);
            if (!validation.valid) {
                throw new Error(validation.reason || "このユーザーIDは設定できません");
            }
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

// アカウント削除
export const deleteAccount = mutation({
    args: {},
    handler: async (ctx) => {
        const userId = await auth.getUserId(ctx);
        if (!userId) {
            throw new Error("認証が必要です");
        }

        // ユーザープロフィールを削除
        const userProfile = await ctx.db
            .query("userProfiles")
            .withIndex("by_userId", (q) => q.eq("userId", userId))
            .first();

        if (userProfile) {
            await ctx.db.delete(userProfile._id);
        }

        // ユーザーが登録した全ての場所を削除
        const userPlaces = await ctx.db
            .query("places")
            .filter((q) => q.eq(q.field("userId"), userId))
            .collect();

        for (const place of userPlaces) {
            await ctx.db.delete(place._id);
        }

        return { success: true };
    },
});

import { v } from "convex/values";
import { mutation } from "./_generated/server";

/**
 * 管理者認証
 * 環境変数 ADMIN_MAIL, ADMIN_PASS と照合
 */
export const authenticateAdminCredentials = mutation({
    args: {
        email: v.string(),
        password: v.string(),
    },
    handler: async (ctx, args) => {
        const adminEmail = process.env.ADMIN_MAIL;
        const adminPassword = process.env.ADMIN_PASS;

        if (!adminEmail || !adminPassword) {
            throw new Error("管理者認証情報が設定されていません");
        }

        const email = args.email.trim();
        const password = args.password.trim();

        // 環境変数と照合
        if (email === adminEmail && password === adminPassword) {
            return {
                authenticated: true,
                message: "管理者認証成功",
            };
        }

        throw new Error("メールアドレスまたはパスワードが正しくありません。");
    },
});

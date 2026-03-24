import { AuthConfig } from "convex/server";

/**
 * Convex Authentication Configuration
 *
 * IMPORTANT: For production, ensure these environment variables are set:
 * - CONVEX_SITE_URL: Your production domain (e.g., https://spotstock.vercel.app)
 * - NEXT_PUBLIC_SITE_URL: Your production domain
 * - VERCEL_URL: Automatically set by Vercel (fallback)
 *
 * Without proper domain configuration, authentication cookies will have an
 * incorrect domain and users will lose their session after re-login.
 *
 * See PRODUCTION_AUTH_FIX.md for detailed setup instructions.
 */

const siteUrl =
  "https://spotstock.vercel.app" ||
  process.env.CONVEX_SITE_URL ||
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined);

if (!siteUrl) {
  // ビルド時やローカルでは未設定でも動作するが、本番での再ログイン後にデータが見えない
  // 問題を防ぐため運用者に通知できるようログを出す
  // （プロジェクトのデプロイ環境で環境変数を設定してください）
  // eslint-disable-next-line no-console
  console.warn(
    "[CONVEX AUTH] ⚠️  CONVEX_SITE_URL is not set. " +
    "Convex authentication cookie domain may be incorrect in production. " +
    "This will cause users to lose their session after re-login. " +
    "Please set CONVEX_SITE_URL in your deployment environment (e.g., Vercel). " +
    "See PRODUCTION_AUTH_FIX.md for instructions."
  );
}

export default {
  providers: [
    {
      domain: siteUrl ?? "http://localhost:3000",
      applicationID: "convex",
    },
  ],
} satisfies AuthConfig;

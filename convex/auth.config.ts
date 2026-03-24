import { AuthConfig } from "convex/server";

// 本番環境では CONVEX_SITE_URL にアプリのオリジン（例: https://example.com）を設定して
// Convex の認証クッキーのドメインを合わせる必要があります。
const siteUrl =
  process.env.CONVEX_SITE_URL ||
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined);

if (!siteUrl) {
  // ビルド時やローカルでは未設定でも動作するが、本番での再ログイン後にデータが見えない
  // 問題を防ぐため運用者に通知できるようログを出す
  // （プロジェクトのデプロイ環境で環境変数を設定してください）
  // eslint-disable-next-line no-console
  console.warn(
    "CONVEX_SITE_URL (or NEXT_PUBLIC_SITE_URL / VERCEL_URL) is not set. Convex auth cookie domain may be incorrect in production."
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

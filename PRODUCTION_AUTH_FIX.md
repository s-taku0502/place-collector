# 本番環境での認証クッキードメイン問題と修正方法

## 問題の概要

本番環境（https://spotstock.vercel.app/）で、再ログイン後にデータが表示されない問題が発生しています。一方、ログイン中に追加したデータは反映されます。これは**Convexの認証クッキーのドメイン設定が不正**であることが原因です。

## 根本原因

### 1. auth.config.ts の環境変数設定不足

ファイル: `convex/auth.config.ts`

```typescript
const siteUrl =
  process.env.CONVEX_SITE_URL ||
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined);

if (!siteUrl) {
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
```

**問題点:**
- `CONVEX_SITE_URL` が設定されていない
- `NEXT_PUBLIC_SITE_URL` が設定されていない
- `VERCEL_URL` が設定されていない
- デフォルト値が `http://localhost:3000` になり、本番環境で不正なドメインでクッキーが発行される

### 2. クッキーのドメイン不一致

Convexの認証クッキーは、`domain` フィールドで指定されたドメインに対してのみ有効です。

**開発環境での動作:**
- ローカルホストで `http://localhost:3000` として実行
- クッキーのドメイン = `http://localhost:3000`
- クッキーが正しく保存・送信される

**本番環境での問題:**
- アプリは `https://spotstock.vercel.app/` で動作
- クッキーのドメイン = `http://localhost:3000`（不正）
- ブラウザがクッキーを送信しない
- ログイン中は認証状態がメモリに保持されているため動作
- ページ再読込・再ログイン時にクッキーが読み込まれず、認証が失われる

## 修正方法

### ステップ1: Vercel環境変数の設定

Vercelプロジェクト設定で、以下の環境変数を追加してください：

| 変数名 | 値 | 説明 |
|--------|-----|------|
| `CONVEX_SITE_URL` | `https://spotstock.vercel.app` | Convexのクッキードメイン設定用 |
| `NEXT_PUBLIC_SITE_URL` | `https://spotstock.vercel.app` | クライアント側で参照可能な本番URL |

**設定手順:**
1. https://vercel.com にログイン
2. プロジェクト「place-collector」を選択
3. Settings → Environment Variables
4. 上記2つの環境変数を追加
5. デプロイを再実行（自動的に再デプロイされるか、手動で Redeploy）

### ステップ2: コード修正（オプション）

より堅牢な設定にするため、以下の修正を推奨します：

#### 修正1: auth.config.ts の改善

```typescript
import { AuthConfig } from "convex/server";

const siteUrl =
  process.env.CONVEX_SITE_URL ||
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined);

if (!siteUrl) {
  console.warn(
    "[CONVEX AUTH] CONVEX_SITE_URL / NEXT_PUBLIC_SITE_URL / VERCEL_URL is not set. " +
    "This may cause authentication cookie domain issues in production. " +
    "Please set CONVEX_SITE_URL in your deployment environment."
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
```

#### 修正2: .env.example の更新

```
# Convex Configuration
CONVEX_DEPLOY_KEY=<your-deploy-key>

# Production Authentication (Required for production)
# Set this to your production domain to ensure auth cookies work correctly
CONVEX_SITE_URL=https://spotstock.vercel.app

# Next.js Public Configuration
NEXT_PUBLIC_SITE_URL=https://spotstock.vercel.app
NEXT_PUBLIC_CONVEX_URL=<your-convex-url>

# Google Maps API
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=<your-api-key>
```

#### 修正3: ConvexClientProvider.tsx の改善（オプション）

```typescript
"use client";

import { ConvexAuthNextjsProvider } from "@convex-dev/auth/nextjs";
import { ConvexReactClient } from "convex/react";
import { ReactNode } from "react";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
if (!convexUrl) {
  console.error(
    "[CONVEX] NEXT_PUBLIC_CONVEX_URL is not set. Convex client will fail at runtime."
  );
}
const convex = new ConvexReactClient(convexUrl ?? "");

export default function ConvexClientProvider({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <ConvexAuthNextjsProvider client={convex}>
      {children}
    </ConvexAuthNextjsProvider>
  );
}
```

### ステップ3: デバッグ確認

修正後、本番環境で以下の確認を実施してください：

1. **ブラウザの開発者ツールでクッキーを確認**
   - F12 → Application → Cookies
   - `convex-token` クッキーが存在し、Domain が `spotstock.vercel.app` になっていることを確認

2. **デバッグページで認証情報を確認**
   - Vercelで `ENABLE_DEBUG_AUTH=true` を設定して再デプロイ
   - https://spotstock.vercel.app/debug-auth にアクセス
   - `identity.subject` と `auth.getUserId()` が一致していることを確認
   - Places テーブル検索結果で件数が表示されることを確認

3. **実際の動作確認**
   - ログイン → データ追加 → ページ再読込 → データが表示されることを確認
   - ログアウト → 再ログイン → データが表示されることを確認

## 参考資料

- [Convex Authentication Documentation](https://docs.convex.dev/auth)
- [Convex Auth Cookie Domain Configuration](https://docs.convex.dev/auth/config)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)

## トラブルシューティング

### 修正後もデータが表示されない場合

1. **クッキーをクリアして再ログイン**
   - ブラウザのキャッシュ・クッキーをクリア
   - 再度ログイン

2. **/debug-auth で詳細を確認**
   - `identity.subject` と `auth.getUserId()` が一致しているか確認
   - Places テーブルで件数が表示されているか確認

3. **Vercel のデプロイログを確認**
   - 環境変数が正しく設定されているか確認
   - コンソール出力で警告メッセージが表示されていないか確認

4. **Convex ダッシュボードで確認**
   - https://dashboard.convex.dev で認証設定を確認
   - Production URL が正しく設定されているか確認

# 本番環境認証問題 - クイック修正ガイド

## 問題
本番環境（https://spotstock.vercel.app/）で、再ログイン後にデータが表示されない

## 原因
Convexの認証クッキーのドメイン設定が不正（`http://localhost:3000` になっている）

## 解決方法（3ステップ）

### ステップ1: Vercelで環境変数を設定（最重要）

Vercelプロジェクト設定で以下を追加：

```
CONVEX_SITE_URL = https://spotstock.vercel.app
NEXT_PUBLIC_SITE_URL = https://spotstock.vercel.app
```

**設定手順:**
1. https://vercel.com にログイン
2. place-collector プロジェクト選択
3. Settings → Environment Variables
4. 上記2つを追加
5. Redeploy

### ステップ2: コード修正（オプション）

以下のファイルを更新することで、より詳しいエラーメッセージが表示されます：

- `convex/auth.config.ts` → `convex/auth.config.ts.fixed` の内容に置き換え
- `.env.example` → 既に更新済み

### ステップ3: 動作確認

修正後、以下を確認：

1. ブラウザの開発者ツール（F12）→ Application → Cookies
   - `convex-token` のドメインが `spotstock.vercel.app` になっているか確認

2. ログイン → データ追加 → ページ再読込 → データが表示されるか確認

3. ログアウト → 再ログイン → データが表示されるか確認

## 詳細情報

詳しい説明は `PRODUCTION_AUTH_FIX.md` を参照してください。

## デバッグが必要な場合

Vercelで `ENABLE_DEBUG_AUTH=true` を設定して再デプロイ後、
https://spotstock.vercel.app/debug-auth にアクセスして認証情報を確認できます。

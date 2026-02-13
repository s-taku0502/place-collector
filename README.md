# Google Maps Web Components 利用仕様

## 概要

本アプリではGoogle Maps Web Components（gmp-map, gmp-advanced-marker, gmpx-place-picker）を利用しています。

## 実装ポイント

- `gmp-map`には`map-id`属性が必須です。Google Cloud Consoleで作成したMap IDを環境変数`NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID`に設定し、コンポーネントで参照してください。
- `gmp-advanced-marker`には`position`属性（例: "35.681236,139.767125"）を指定してください。
- Google Maps JS APIおよびWeb Components用スクリプトは`_app.tsx`や`layout.tsx`で読み込んでください。

## 環境変数の設定例

```.env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=（Google Maps APIキー）
NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID=（Google Cloud Consoleで発行したMap ID）
```

## 注意事項

- APIキーとMap IDは漏洩しないよう、`.env`ファイル等で管理してください。
- 詳細な使い方や最新仕様はGoogle公式ドキュメントを参照してください。

# Place Collector（行きたい・行った場所メモアプリ）

Next.js + Convex + Convex Auth で作られた、行きたい／行った場所を管理する個人用アプリです。場所の基本情報に加えて、行く前メモ・行ったあとのフィードバック（複数回）を残せます。

## 主な機能

- 場所の登録・編集（名称、住所、最寄り駅、ジャンル、都道府県、季節、気分、行動ステータス など）
- 行く前メモ／URL の保存
- 行ったあとのフィードバックを複数回保存（☆5段階評価・また行きたいか・自由記述メモ）
- 詳細画面の「行った！」ボタンでステータスを更新し、フィードバック入力画面へ遷移
- サインイン（Convex Auth）

## 画面とルーティング（一部）

- 一覧: `/place`
- 新規作成: `/place/new`
- 詳細: `/place/[id]/detail`
- 編集: `/place/[id]/edit`
- 行ったあとのフィードバック: `/place/[id]/detail/feedback`

## 開発環境のセットアップ

### 必要要件

- Node.js 20 以降（推奨）
- npm

### 初回セットアップと起動

```bash
npm install
npm run dev
```

`npm run dev` は Next.js（フロントエンド）と Convex（バックエンド）を並行起動します。Convex の初回起動時は CLI の指示に従ってログイン／プロジェクト作成を行ってください。

便利スクリプト:

- Lint: `npm run lint`
- 本番ビルド: `npm run build`
- 本番起動: `npm start`

## 使い方の流れ

### 場所の登録

- `/place/new` で行きたい場所を登録します。
- Google Places API を利用した検索機能で、名称や住所を自動入力できます。

### 行く前メモの保存

- 詳細画面（`/place/[id]/detail`）で「行く前メモ」や関連URLを保存できます。

### 行ったあとのフィードバック保存

- フィードバック画面では、☆5評価、また行きたいか、メモ、関連URLを入力して保存できます。
- フィードバックは複数回追加でき、訪問のたびに記録を残せます。
- 詳細画面の下部に、最新順で過去のフィードバックが表示されます。
※画像アップロード機能は未実装です。

## 今後の方針

### 一覧画面

- 都道府県ごとの一覧表示機能
- フィルタリング・ソート機能
- キーワード検索機能

### 地図表示

- 行きたい場所を地図上で一覧表示する機能
- 全国マップから都道府県別に場所を絞り込む機能
  - 全国マップでは、その都道府県に登録されている場所の数を表示

### AI による旅程プランニング支援

- 登録した場所をもとに、AIが最適な旅程プランを提案する機能

## データモデル（概要）

`places` テーブルの主なフィールド:

- 基本情報: `title`, `address`, `station`, `genre`, `prefecture`, `seasons`, `mood`, `status`
- 行く前: `beforeMemo`, `beforeUrl`
- 行ったあと（履歴）: `afterMemos[]`（`memo`, `rating`, `wantToVisitAgain`, `url`, `createdAt`）

## 認証

Convex Auth を利用しています。サインイン画面は `/signin` です。

## メモ

- このリポジトリは Convex のローカル開発を前提にしています。クラウドへデプロイする場合は Convex/Next.js 双方のドキュメントに従ってください。
- 環境変数の追加が必要になった場合は `.env.local`（Next.js）や Convex の設定をご利用ください。

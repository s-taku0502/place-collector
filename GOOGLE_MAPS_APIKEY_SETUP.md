# Google Maps APIキー設定

このアプリではGoogle Maps Places APIを利用します。

## 手順

1. Google Cloud ConsoleでAPIキーを取得し、Places APIを有効化してください。
2. プロジェクトルートに`.env.local`ファイルを作成し、下記のように記述してください。

```
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=あなたのAPIキー
```

- `.env.local`はgit管理対象外です。
- APIキーは絶対に公開しないでください。
- APIキーの制限（リファラー制限等）も推奨します。

## 参考
- https://console.cloud.google.com/
- https://developers.google.com/maps/documentation/places/web-service/overview?hl=ja

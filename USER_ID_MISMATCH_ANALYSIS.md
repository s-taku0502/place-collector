# ユーザーID不整合によるデータ非表示問題の分析

## 現象
- ユーザープロフィール（`userProfiles`）は取得できている。
- 登録した「場所」（`places`）が一覧に表示されない。
- ログイン中に追加したデータは表示されるが、再ログイン後に消える（ように見える）。

## 原因の推測：ID形式の不一致

Convex Auth（`@convex-dev/auth`）を使用している場合、ユーザーを識別するIDには以下の2種類が存在し、これらが混在している可能性があります。

1. **`userId` (Internal ID)**: `ctx.db.insert("users", ...)` で生成される、Convex内部のテーブルID（例: `jh7...`）。`auth.getUserId(ctx)` で取得される。
2. **`subject` (External ID)**: JWTの `sub` クレーム。パスワード認証の場合、通常は `userId` と同じか、プロバイダー名を含む形式（例: `password|jh7...`）。`ctx.auth.getUserIdentity()` の `subject` フィールド。

### なぜプロフィールは見えて、場所は見えないのか？

コードを確認したところ、以下の違いがありました：

- **プロフィール取得 (`users.ts`)**:
  `auth.getUserId(ctx)` を使用して `userProfiles` テーブルを検索している。
  ```typescript
  const userId = await auth.getUserId(ctx);
  const userProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
  ```

- **場所の取得 (`places.ts`)**:
  `auth.getUserId(ctx)` で検索し、見つからない場合に `identity.subject` でフォールバックしている。
  ```typescript
  const userId = await auth.getUserId(ctx);
  // ... getPlacesForUserWithFallback 内 ...
  const placesForUser = await ctx.db.query("places").withIndex("by_user", (q) => q.eq("userId", userId)).collect();
  if (placesForUser.length > 0) return placesForUser;
  // フォールバック
  const identity = await ctx.auth.getUserIdentity();
  const placesForLegacy = await ctx.db.query("places").withIndex("by_user", (q) => q.eq("userId", identity.subject)).collect();
  ```

### 発生している問題のシナリオ

1. **データの保存時**:
   `places.add` ミューテーションは `auth.getUserId(ctx)` を使用して `userId` を保存している。
   
2. **データの取得時**:
   `getPlacesForUserWithFallback` は、まず `auth.getUserId(ctx)` で検索し、**1件でも見つかればそれを返して終了する**。

3. **不整合の発生**:
   もし過去のデータが `identity.subject` 形式のIDで保存されており、新しく `auth.getUserId(ctx)` 形式のIDで1件でもデータを追加すると、**古いデータ（過去に登録した場所）がフォールバックされなくなり、新しい1件しか見えなくなる**。

## 修正方針

`getPlacesForUserWithFallback` を改善し、**全ての可能性のあるIDで検索した結果をマージして返す**ように変更します。

```typescript
async function getPlacesForUserWithFallback(ctx: any, userId: string) {
  const allPlaces = new Map();

  // 1. 現在の userId で検索
  const placesForUser = await ctx.db
    .query("places")
    .withIndex("by_user", (q: any) => q.eq("userId", userId))
    .collect();
  placesForUser.forEach(p => allPlaces.set(p._id, p));

  // 2. identity.subject で検索
  const identity = await ctx.auth.getUserIdentity();
  if (identity?.subject && identity.subject !== userId) {
    const placesForLegacy = await ctx.db
      .query("places")
      .withIndex("by_user", (q: any) => q.eq("userId", identity.subject))
      .collect();
    placesForLegacy.forEach(p => allPlaces.set(p._id, p));

    // 3. 短い形式のIDでも検索
    const shortId = identity.subject.split("|")[0];
    if (shortId && shortId !== userId && shortId !== identity.subject) {
      const placesForShortId = await ctx.db
        .query("places")
        .filter((q: any) => q.eq(q.field("userId"), shortId))
        .collect();
      placesForShortId.forEach(p => allPlaces.set(p._id, p));
    }
  }

  return Array.from(allPlaces.values());
}
```

これにより、IDの形式が遷移期間中で混在していても、全ての自分のデータが表示されるようになります。

"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function DebugAuthPage() {
  const identity = useQuery(api.debug.getCurrentUserIdentity, {});
  const router = useRouter();

  useEffect(() => {
    if (!identity?.authenticated) {
      const timer = setTimeout(() => {
        router.push("/signin");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [identity, router]);

  if (!identity) {
    return (
      <main className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold mb-4">認証情報診断 (読込中...)</h1>
          <p className="text-gray-600">データを読み込んでいます...</p>
        </div>
      </main>
    );
  }

  if (!identity.authenticated) {
    return (
      <main className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold mb-4 text-red-600">未認証</h1>
          <p className="text-gray-600 mb-4">{identity.message}</p>
          <p className="text-gray-500">3秒後にログインページへ移動します...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">認証情報診断</h1>
        <p className="text-gray-600 mb-6">
          以下の情報からデータ表示されない理由を特定できます
        </p>

        {/* JWT Identity */}
        <section className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-blue-600">JWT Identity (decode 結果)</h2>
          <div className="bg-gray-50 p-4 rounded font-mono text-sm overflow-x-auto">
            <table className="w-full">
              <tbody>
                <tr className="border-b">
                  <td className="font-semibold py-2 pr-4">sub (subject)</td>
                  <td className="text-red-600 break-all">{identity.identity.subject || "−"}</td>
                </tr>
                <tr className="border-b">
                  <td className="font-semibold py-2 pr-4">email</td>
                  <td>{identity.identity.email || "−"}</td>
                </tr>
                <tr className="border-b">
                  <td className="font-semibold py-2 pr-4">emailVerified</td>
                  <td>{String(identity.identity.emailVerified)}</td>
                </tr>
                <tr className="border-b">
                  <td className="font-semibold py-2 pr-4">issuer</td>
                  <td>{identity.identity.issuer || "−"}</td>
                </tr>
                <tr className="border-b">
                  <td className="font-semibold py-2 pr-4">tokenIdentifier</td>
                  <td>
                    <code className="bg-gray-200 px-2 py-1 rounded text-xs">
                      {identity.identity.tokenIdentifier || "−"}
                    </code>
                  </td>
                </tr>
                <tr>
                  <td className="font-semibold py-2 pr-4">全フィールド</td>
                  <td>
                    <code className="bg-gray-200 px-2 py-1 rounded text-xs">
                      {identity.identity.allKeys?.join(", ") || "−"}
                    </code>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Auth.getUserId() result */}
        <section className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-blue-600">auth.getUserId(ctx) の結果</h2>
          <div className="bg-gray-50 p-4 rounded font-mono text-sm">
            <div>
              <span className="font-semibold">userId: </span>
              <span className="text-green-600 break-all">{identity.auth.userId}</span>
            </div>
            <div className="text-gray-600 text-xs mt-2">
              型: {identity.auth.userType}
            </div>
          </div>
        </section>

        {/* Auth テーブル確認 */}
        <section className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-blue-600">Auth テーブル検索結果</h2>
          {identity.authUser ? (
            <div className="bg-gray-50 p-4 rounded">
              <div className="mb-2">
                <span className="font-semibold">✓ ユーザーが見つかりました</span>
              </div>
              <div>
                <span className="text-gray-600">_id: </span>
                <code className="font-mono text-sm bg-gray-200 px-2 py-1 rounded">
                  {identity.authUser._id}
                </code>
              </div>
              <div>
                <span className="text-gray-600">email: </span>
                <span>{identity.authUser.email}</span>
              </div>
            </div>
          ) : (
            <div className="bg-red-50 p-4 rounded text-red-700">
              ✗ ユーザーが見つかりません (userId で検索失敗)
            </div>
          )}
        </section>

        {/* Places データ確認 */}
        <section className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-blue-600">Places テーブル検索結果</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">
                auth.getUserId() で検索
              </h3>
              <div className="bg-gray-50 p-4 rounded">
                <div className="mb-3">
                  件数: <span className="text-xl font-bold text-green-600">{identity.places.countForUserId}</span>
                </div>
                {identity.places.countForUserId > 0 ? (
                  <div className="text-sm text-gray-600">
                    <p className="font-semibold mb-2">サンプル:</p>
                    <ul className="list-disc pl-5">
                      {identity.places.samplesForUserId?.map((p: any) => (
                        <li key={p._id}>
                          {p.title} (ID: {p._id})
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p className="text-red-600">⚠ データが見つかりません</p>
                )}
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-700 mb-2">
                identity.subject で検索（フォールバック）
              </h3>
              <div className="bg-gray-50 p-4 rounded">
                <div className="mb-3">
                  件数: <span className="text-xl font-bold">{identity.places.countForIdentSubject}</span>
                </div>
                {identity.places.countForIdentSubject > 0 ? (
                  <div className="text-sm text-gray-600">
                    <p className="font-semibold mb-2 text-orange-600">
                      ⚠ データがこちらにあります（userId 不整合）
                    </p>
                    <ul className="list-disc pl-5">
                      {identity.places.samplesForIdentSubject?.map((p: any) => (
                        <li key={p._id}>
                          {p.title} (ID: {p._id})
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p className="text-gray-600">検索結果なし</p>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* データベース統計 */}
        <section className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-blue-600">データベース統計</h2>
          <div className="bg-gray-50 p-4 rounded">
            <div className="mb-4">
              <span className="font-semibold">Places テーブル総件数: </span>
              <span className="text-lg font-bold">{identity.database.totalPlacesInDB}</span>
            </div>
            <div>
              <span className="font-semibold">ユニークな userId:</span>
              <div className="mt-2 space-y-1">
                {identity.database.uniqueUserIds?.length > 0 ? (
                  identity.database.uniqueUserIds.map((uid: string) => (
                    <div
                      key={uid}
                      className={`p-2 rounded font-mono text-sm ${
                        uid === identity.auth.userId
                          ? "bg-green-50 text-green-700 font-semibold"
                          : uid === identity.identity.subject
                            ? "bg-orange-50 text-orange-700"
                            : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {uid}
                      {uid === identity.auth.userId && " ← 現在の userId"}
                      {uid === identity.identity.subject &&
                        uid !== identity.auth.userId &&
                        " ← 別フォーマット (sub)"}
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500">データなし</p>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* 診断結果 */}
        <section className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-blue-600">診断結果</h2>
          <div className="space-y-3">
            {identity.places.countForUserId > 0 ? (
              <div className="bg-green-50 p-4 rounded border-l-4 border-green-600">
                <p className="font-semibold text-green-700">✓ 正常: データが表示されるはずです</p>
                <p className="text-sm text-gray-700 mt-1">
                  auth.getUserId() で{identity.places.countForUserId}件のデータが見つかりました。
                </p>
              </div>
            ) : identity.places.countForIdentSubject > 0 ? (
              <div className="bg-orange-50 p-4 rounded border-l-4 border-orange-600">
                <p className="font-semibold text-orange-700">⚠ userId 不整合を検出</p>
                <p className="text-sm text-gray-700 mt-1">
                  identity.subject 形式で{identity.places.countForIdentSubject}件のデータが保存されています。
                  フォールバック検索が機能しているはずです。
                </p>
              </div>
            ) : (
              <div className="bg-red-50 p-4 rounded border-l-4 border-red-600">
                <p className="font-semibold text-red-700">✗ データが見つかりません</p>
                <p className="text-sm text-gray-700 mt-1">
                  auth.getUserId() も identity.subject でもデータが見つかりません。
                  新しいアカウントか、異なるユーザーIDで保存されている可能性があります。
                </p>
              </div>
            )}
          </div>
        </section>

        <div className="flex gap-4 mt-8">
          <button
            onClick={() => router.push("/place")}
            className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
          >
            Place ページへ戻る
          </button>
          <button
            onClick={() => window.location.reload()}
            className="flex-1 bg-gray-600 text-white py-2 rounded-lg hover:bg-gray-700"
          >
             再読込
          </button>
        </div>
      </div>
    </main>
  );
}

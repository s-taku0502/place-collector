"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function DebugAuthPage() {
    const data = useQuery(api.debug.getCurrentUserIdentity, {});
    const router = useRouter();

    useEffect(() => {
        if (data && !data.authenticated) {
            const timer = setTimeout(() => {
                router.push("/signin");
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [data, router]);

    if (!data) {
        return (
            <main className="min-h-screen bg-gray-100 p-8">
                <div className="max-w-2xl mx-auto">
                    <h1 className="text-2xl font-bold mb-4">認証情報診断 (読込中...)</h1>
                    <p className="text-gray-600">データを読み込んでいます...</p>
                </div>
            </main>
        );
    }

    if (!data.authenticated) {
        return (
            <main className="min-h-screen bg-gray-100 p-8">
                <div className="max-w-2xl mx-auto">
                    <h1 className="text-2xl font-bold mb-4 text-red-600">未認証</h1>
                    <p className="text-gray-600 mb-4">{data.message}</p>
                    <p className="text-gray-500">3秒後にログインページへ移動します...</p>
                    {data.error && (
                        <div className="mt-4 p-4 bg-red-50 rounded border border-red-200">
                            <p className="text-red-700 font-semibold">エラー详细:</p>
                            <p className="text-red-600 text-sm mt-2">{data.error}</p>
                            {data.error_stack && (
                                <pre className="text-xs text-red-500 mt-2 overflow-x-auto">
                                    {data.error_stack}
                                </pre>
                            )}
                        </div>
                    )}
                </div>
            </main>
        );
    }

    const userIdMatch = data.auth_userId === data.identity_subject;
    const dataFoundForUserId = (data.places_count_for_userId ?? 0) > 0;
    const dataFoundForIdentSubject = (data.places_count_for_identity_subject ?? 0) > 0;

    return (
        <main className="min-h-screen bg-gray-100 p-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold mb-2">認証情報診断</h1>
                <p className="text-gray-600 mb-6">
                    以下の情報からデータ表示されない理由を特定できます
                </p>

                {/* 認証ID一覧 */}
                <section className="bg-white rounded-lg shadow p-6 mb-6">
                    <h2 className="text-xl font-semibold mb-4 text-blue-600">認証情報</h2>
                    <div className="space-y-3">
                        <div className="p-3 bg-gray-50 rounded">
                            <div className="font-semibold text-sm text-gray-600">identity.subject (JWT sub)</div>
                            <div className="text-lg font-mono text-red-600 mt-1 break-all">
                                {data.identity_subject || "(未取得)"}
                            </div>
                        </div>
                        <div className="p-3 bg-gray-50 rounded">
                            <div className="font-semibold text-sm text-gray-600">identity.email</div>
                            <div className="text-lg font-mono mt-1">
                                {data.identity_email || "(未取得)"}
                            </div>
                        </div>
                        <div className="p-3 bg-gray-50 rounded">
                            <div className="font-semibold text-sm text-gray-600">auth.getUserId()</div>
                            <div className="text-lg font-mono text-green-600 mt-1 break-all">
                                {data.auth_userId || "(未取得)"}
                            </div>
                        </div>
                        <div className="p-3 bg-blue-50 rounded border-l-4 border-blue-500">
                            <div className="font-semibold text-sm text-blue-600">ID の一致状態</div>
                            <div className={`text-lg font-bold mt-1 ${userIdMatch ? "text-green-600" : "text-orange-600"}`}>
                                {userIdMatch ? "✓ 一致" : "✗ 不一致"}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Places テーブル検索結果 */}
                <section className="bg-white rounded-lg shadow p-6 mb-6">
                    <h2 className="text-xl font-semibold mb-4 text-blue-600">Places テーブル検索結果</h2>
                    <div className="space-y-4">
                        <div className="p-4 bg-gray-50 rounded">
                            <div className="font-semibold text-gray-700 mb-2">
                                auth.getUserId() で検索
                            </div>
                            <div className="text-2xl font-bold">
                                <span className={dataFoundForUserId ? "text-green-600" : "text-red-600"}>
                                    {data.places_count_for_userId}
                                </span>
                                <span className="text-sm text-gray-600 ml-2">件</span>
                            </div>
                        </div>

                        <div className="p-4 bg-gray-50 rounded">
                            <div className="font-semibold text-gray-700 mb-2">
                                identity.subject で検索（フォールバック）
                            </div>
                            <div className="text-2xl font-bold">
                                <span className={dataFoundForIdentSubject ? "text-orange-600" : "text-gray-600"}>
                                    {data.places_count_for_identity_subject}
                                </span>
                                <span className="text-sm text-gray-600 ml-2">件</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* データベース統計 */}
                <section className="bg-white rounded-lg shadow p-6 mb-6">
                    <h2 className="text-xl font-semibold mb-4 text-blue-600">データベース統計</h2>
                    <div className="p-4 bg-gray-50 rounded">
                        <div className="mb-4">
                            <span className="font-semibold">Places テーブル総件数: </span>
                            <span className="text-xl font-bold">{data.total_places_in_db}</span>
                        </div>
                        <div>
                            <span className="font-semibold block mb-3">ユニークな userId:</span>
                            <div className="space-y-2">
                                {data.unique_user_ids && data.unique_user_ids.length > 0 ? (
                                    data.unique_user_ids.map((uid: string) => (
                                        <div
                                            key={uid}
                                            className={`p-3 rounded font-mono text-sm break-all ${uid === data.auth_userId
                                                    ? "bg-green-50 text-green-700 font-semibold border-l-4 border-green-600"
                                                    : uid === data.identity_subject
                                                        ? "bg-orange-50 text-orange-700 border-l-4 border-orange-500"
                                                        : "bg-gray-100 text-gray-600"
                                                }`}
                                        >
                                            {uid}
                                            {uid === data.auth_userId && " ← 現在の userId"}
                                            {uid === data.identity_subject &&
                                                uid !== data.auth_userId &&
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
                        {dataFoundForUserId ? (
                            <div className="bg-green-50 p-4 rounded border-l-4 border-green-600">
                                <p className="font-semibold text-green-700">✓ 正常: データが表示されるはずです</p>
                                <p className="text-sm text-gray-700 mt-1">
                                    auth.getUserId() で{data.places_count_for_userId}件のデータが見つかりました。
                                </p>
                            </div>
                        ) : dataFoundForIdentSubject ? (
                            <div className="bg-orange-50 p-4 rounded border-l-4 border-orange-600">
                                <p className="font-semibold text-orange-700">⚠ userId 不整合を検出</p>
                                <p className="text-sm text-gray-700 mt-1">
                                    identity.subject 形式で{data.places_count_for_identity_subject}件のデータが保存されています。
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

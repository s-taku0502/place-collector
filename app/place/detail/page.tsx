"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import Link from "next/link";

const DONE_STATUS = "行った（また行きたい）";

export default function PlaceDetailPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const id = searchParams.get("id") as Id<"places"> | null;

    const place = useQuery(api.places.get, id ? { id } : "skip");
    const toggle = useMutation(api.places.toggleStatus);

    if (!id) return <main className="p-6">ID が指定されていません</main>;
    if (place === undefined) return <main className="p-6">読み込み中…</main>;
    if (place === null) return <main className="p-6">データが見つかりません</main>;

    const markDone = () => {
        void toggle({ id: place._id, status: DONE_STATUS });
    };

    return (
        <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
            <div className="mx-auto max-w-3xl px-4">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <p className="text-xs text-gray-500">{place.prefecture ?? "都道府県未設定"}</p>
                        <h1 className="text-3xl font-bold text-gray-900">{place.title}</h1>
                        <p className="mt-2 text-gray-700">{place.address ?? "住所未設定"}</p>
                        {place.station && <p className="text-sm text-gray-500">最寄り駅: {place.station}</p>}
                        <p className="mt-1 text-sm text-gray-600">ジャンル: {place.genre ?? "未設定"}</p>
                        <p className="mt-1 text-sm text-gray-600">気分: {place.mood ?? "未設定"}</p>
                        <p className="mt-1 text-sm text-gray-600">行動: {place.status ?? "未設定"}</p>
                        <p className="mt-1 text-sm text-gray-600">
                            季節: {place.seasons?.length ? place.seasons.join(", ") : "未設定"}
                        </p>
                    </div>
                    <div className="flex flex-col gap-2">
                        <button
                            onClick={markDone}
                            className="rounded-lg bg-gradient-to-r from-green-500 to-green-600 px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:shadow-lg hover:scale-105 active:scale-95"
                        >
                            行った！にする
                        </button>
                        <Link
                            href={`/place/${place._id}/edit`}
                            className="rounded-lg border-2 border-gray-200 px-4 py-2 text-center text-sm font-semibold text-gray-700 shadow-sm transition hover:border-gray-400 hover:bg-gray-100 active:scale-95"
                        >
                            編集
                        </Link>
                        <button
                            onClick={() => router.back()}
                            className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                            戻る
                        </button>
                    </div>
                </div>

                <div className="mt-8 grid gap-4 md:grid-cols-2">
                    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                        <h2 className="text-lg font-semibold text-gray-900">行く前メモ</h2>
                        <p className="mt-2 whitespace-pre-line text-sm text-gray-700">
                            {place.beforeMemo || "なし"}
                        </p>
                        {place.beforeUrl && (
                            <a
                                href={place.beforeUrl}
                                className="mt-2 inline-block text-sm text-blue-600 underline"
                                target="_blank"
                            >
                                リンクを開く
                            </a>
                        )}
                    </div>
                    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                        <h2 className="text-lg font-semibold text-gray-900">行ったあとメモ</h2>
                        <p className="mt-2 whitespace-pre-line text-sm text-gray-700">
                            {place.afterMemo || "なし"}
                        </p>
                        {place.afterUrl && (
                            <a
                                href={place.afterUrl}
                                className="mt-2 inline-block text-sm text-blue-600 underline"
                                target="_blank"
                            >
                                リンクを開く
                            </a>
                        )}
                        {place.rating && (
                            <p className="mt-2 text-sm text-gray-700">評価: {place.rating} / 5</p>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
}

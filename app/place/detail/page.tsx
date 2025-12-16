"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import Link from "next/link";
import { useState, useMemo } from "react";

const DONE_STATUS = "行った（また行きたい）";

export default function PlaceDetailPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const id = searchParams.get("id") as Id<"places"> | null;

    const place = useQuery(api.places.get, id ? { id } : "skip");
    const toggle = useMutation(api.places.toggleStatus);
    const addAfterMemo = useMutation(api.places.addAfterMemo);

    const [afterMemoInput, setAfterMemoInput] = useState("");
    const [afterMemoUrl, setAfterMemoUrl] = useState("");
    const [isSubmittingMemo, setIsSubmittingMemo] = useState(false);

    const afterMemos = useMemo(() => {
        if (!place) return [];

        const seed =
            place.afterMemos && place.afterMemos.length > 0
                ? place.afterMemos
                : place.afterMemo
                  ? [
                        {
                            memo: place.afterMemo,
                            url: place.afterUrl,
                            createdAt: place.updatedAt ?? place.createdAt ?? Date.now(),
                        },
                    ]
                  : [];

        return [...seed].sort((a, b) => b.createdAt - a.createdAt);
    }, [place]);

    if (!id) return <main className="p-6">ID が指定されていません</main>;
    if (place === undefined) return <main className="p-6">読み込み中…</main>;
    if (place === null) return <main className="p-6">データが見つかりません</main>;

    const markDone = () => {
        void toggle({ id: place._id, status: DONE_STATUS });
    };

    const handleAddAfterMemo = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!afterMemoInput.trim()) return;

        setIsSubmittingMemo(true);
        try {
            await addAfterMemo({
                id: place._id,
                memo: afterMemoInput.trim(),
                url: afterMemoUrl.trim() || undefined,
            });
            setAfterMemoInput("");
            setAfterMemoUrl("");
        } finally {
            setIsSubmittingMemo(false);
        }
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
                        <form onSubmit={handleAddAfterMemo} className="mt-3 space-y-2">
                            <textarea
                                name="afterMemo"
                                className="w-full rounded-md border border-gray-200 p-2 text-sm focus:border-gray-400 focus:outline-none"
                                placeholder="行ったあとに感じたことや覚え書きを追加"
                                value={afterMemoInput}
                                onChange={(e) => setAfterMemoInput(e.target.value)}
                                rows={3}
                            />
                            <input
                                name="afterUrl"
                                className="w-full rounded-md border border-gray-200 p-2 text-sm focus:border-gray-400 focus:outline-none"
                                placeholder="参考リンク (任意)"
                                value={afterMemoUrl}
                                onChange={(e) => setAfterMemoUrl(e.target.value)}
                                type="url"
                            />
                            <button
                                type="submit"
                                disabled={isSubmittingMemo || !afterMemoInput.trim()}
                                className="w-full rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:shadow-lg hover:scale-[1.01] active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {isSubmittingMemo ? "追加中…" : "メモを追加"}
                            </button>
                        </form>

                        <div className="mt-4 space-y-3">
                            {afterMemos.length === 0 && (
                                <p className="text-sm text-gray-600">まだメモがありません</p>
                            )}
                            {afterMemos.map((memo) => (
                                <div key={`${memo.createdAt}-${memo.memo.slice(0, 8)}`} className="rounded-lg border border-gray-100 bg-gray-50 p-3 shadow-inner">
                                    <p className="whitespace-pre-line text-sm text-gray-800">{memo.memo}</p>
                                    <div className="mt-1 flex items-center justify-between text-xs text-gray-500">
                                        <span>
                                            {new Date(memo.createdAt).toLocaleString("ja-JP", {
                                                month: "short",
                                                day: "numeric",
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            })}
                                        </span>
                                        {memo.url && (
                                            <a
                                                href={memo.url}
                                                className="text-blue-600 underline"
                                                target="_blank"
                                                rel="noreferrer"
                                            >
                                                リンクを開く
                                            </a>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {place.rating && (
                            <p className="mt-4 text-sm text-gray-700">評価: {place.rating} / 5</p>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
}

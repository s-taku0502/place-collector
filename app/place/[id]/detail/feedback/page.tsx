"use client";

import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useState } from "react";

export default function PlaceFeedbackPage() {
    const params = useParams<{ id: string }>();
    const router = useRouter();
    const id = (params?.id as Id<"places">) ?? null;

    const place = useQuery(api.places.get, id ? { id } : "skip");
    const addAfterMemo = useMutation(api.places.addAfterMemo);

    const [rating, setRating] = useState<string>("");
    const [wantToVisitAgain, setWantToVisitAgain] = useState<string>("");
    const [memo, setMemo] = useState("");
    const [visitedDate, setVisitedDate] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [dateError, setDateError] = useState<string>("");

    if (!id) return <main className="p-6">ID が指定されていません</main>;
    if (place === undefined) return <main className="p-6">読み込み中…</main>;
    if (place === null) return <main className="p-6">データが見つかりません</main>;

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setDateError("");
        if (!rating || !wantToVisitAgain || !memo.trim()) return;

        // 日付バリデーション: 入力があり未来日ならエラー
        if (visitedDate) {
            const today = new Date();
            today.setHours(0,0,0,0);
            const inputDate = new Date(visitedDate);
            if (inputDate > today) {
                setDateError("未来の日付は選択できません");
                return;
            }
        }

        setIsSubmitting(true);
        try {
            await addAfterMemo({
                id: place._id,
                memo: memo.trim(),
                rating: Number(rating),
                wantToVisitAgain,
                url: undefined,
                visitedDate: visitedDate || undefined,
            });
            router.push(`/place/${place._id}/detail`);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
            <div className="mx-auto max-w-2xl px-4">
                <div className="mb-6 text-sm text-gray-600">
                    <button
                        onClick={() => router.back()}
                        className="text-blue-600 underline"
                        type="button"
                    >
                        戻る
                    </button>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                    <p className="text-xs uppercase tracking-wide text-gray-500">Feedback</p>
                    <h1 className="mt-1 text-2xl font-bold text-gray-900">{place.title} のフィードバック</h1>
                    <p className="mt-1 text-sm text-gray-600">行ったあとの感想を残してください。</p>

                    <form onSubmit={handleSubmit} className="mt-6 space-y-6">
                        <div>
                            <p className="text-sm font-medium text-gray-800">評価（☆5段階）</p>
                            <div className="mt-2 flex flex-wrap gap-2">
                                {[5, 4, 3, 2, 1].map((value) => (
                                    <label
                                        key={value}
                                        className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm shadow-sm transition ${rating === String(value)
                                                ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                                                : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                                            }`}
                                    >
                                        <input
                                            type="radio"
                                            name="rating"
                                            value={value}
                                            checked={rating === String(value)}
                                            onChange={(e) => setRating(e.target.value)}
                                            className="h-4 w-4 text-indigo-600"
                                        />
                                        <span>{"★".repeat(value)}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div>
                            <p className="text-sm font-medium text-gray-800">また行きたい？（単数選択）</p>
                            <div className="mt-2 grid gap-2 sm:grid-cols-2">
                                {["また行きたい", "今回で十分"].map((choice) => (
                                    <label
                                        key={choice}
                                        className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm shadow-sm transition ${wantToVisitAgain === choice
                                                ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                                                : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                                            }`}
                                    >
                                        <input
                                            type="radio"
                                            name="wantToVisitAgain"
                                            value={choice}
                                            checked={wantToVisitAgain === choice}
                                            onChange={(e) => setWantToVisitAgain(e.target.value)}
                                            className="h-4 w-4 text-emerald-600"
                                        />
                                        <span>{choice}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-medium text-gray-800">感想など</label>
                            <textarea
                                className="mt-2 w-full rounded-lg border border-gray-200 p-3 text-sm shadow-sm focus:border-gray-400 focus:outline-none"
                                placeholder="印象に残ったこと、良かった点、気になった点など"
                                rows={6}
                                value={memo}
                                onChange={(e) => setMemo(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-800">行った日付 <span className="text-gray-500">(当日以前のみ)</span></label>
                            <input
                                type="date"
                                className="mt-2 w-full rounded-lg border border-gray-200 p-3 text-sm shadow-sm focus:border-gray-400 focus:outline-none"
                                value={visitedDate}
                                onChange={e => setVisitedDate(e.target.value)}
                                max={new Date().toISOString().split("T")[0]}
                            />
                            {dateError && <p className="mt-1 text-sm text-red-600">{dateError}</p>}
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting || !rating || !wantToVisitAgain || !memo.trim()}
                            className="w-full rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-3 text-sm font-semibold text-white shadow-md transition hover:shadow-lg hover:scale-[1.01] active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {isSubmitting ? "送信中..." : "フィードバックを保存"}
                        </button>
                    </form>
                </div>
            </div>
        </main>
    );
}

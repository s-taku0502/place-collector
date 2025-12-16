"use client";
import { useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { useState } from "react";
import {
    PREFECTURES,
    GENRES,
    SEASONS,
    MOODS,
    STATUSES,
    DEFAULT_PREFECTURE_INDEX,
    DEFAULT_GENRE_INDEX,
    DEFAULT_MOOD_INDEX,
    DEFAULT_STATUS_INDEX,
} from "@/lib/constants";

// 住所から都道府県を自動判定する関数
function extractPrefectureFromAddress(addressText: string): string {
    for (const pref of PREFECTURES) {
        if (addressText.startsWith(pref)) {
            return pref;
        }
    }
    return PREFECTURES[DEFAULT_PREFECTURE_INDEX]; // 判定失敗時はデフォルト
}

export default function NewPlace() {
    const router = useRouter();
    const add = useMutation(api.places.add);

    const [title, setTitle] = useState("");
    const [address, setAddress] = useState("");
    const [station, setStation] = useState("");
    const [genre, setGenre] = useState(GENRES[DEFAULT_GENRE_INDEX]);
    const [prefecture, setPrefecture] = useState(PREFECTURES[DEFAULT_PREFECTURE_INDEX]);
    const [selectedSeasons, setSelectedSeasons] = useState<string[]>([]);
    const [mood, setMood] = useState(MOODS[DEFAULT_MOOD_INDEX]);
    const [status, setStatus] = useState(STATUSES[DEFAULT_STATUS_INDEX]);
    const [beforeMemo, setBeforeMemo] = useState("");
    const [beforeUrl, setBeforeUrl] = useState("");

    const toggleSeason = (season: string) => {
        setSelectedSeasons(prev =>
            prev.includes(season)
                ? prev.filter(s => s !== season)
                : [...prev, season]
        );
    };

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();

        if (!title.trim()) {
            alert("名称は必須です");
            return;
        }
        if (!address.trim()) {
            alert("住所は必須です");
            return;
        }
        if (selectedSeasons.length === 0) {
            alert("季節を選択してください");
            return;
        }

        try {
            await add({
                title: title.trim(),
                address: address.trim(),
                station: station.trim() || undefined,
                genre,
                prefecture,
                seasons: selectedSeasons,
                mood,
                status,
                beforeMemo: beforeMemo.trim() || undefined,
                beforeUrl: beforeUrl.trim() || undefined,
            });
            router.push("/");
        } catch (err) {
            alert("追加に失敗しました");
            console.error(err);
        }
    }

    return (
        <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
            <div className="mx-auto max-w-2xl px-4">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">新しい場所を追加</h1>

                <form onSubmit={onSubmit} className="space-y-6 bg-white rounded-xl p-6 shadow-lg">
                    {/* 基本情報 */}
                    <div className="border-b pb-6">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4">基本情報</h2>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                名称 <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                placeholder="例：〇〇カフェ"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                住所 <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                placeholder="例：東京都渋谷区〇〇"
                                value={address}
                                onChange={(e) => {
                                    setAddress(e.target.value);
                                    // 住所から都道府県を自動判定
                                    const newPref = extractPrefectureFromAddress(e.target.value);
                                    setPrefecture(newPref);
                                }}
                                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                最寄り駅 <span className="text-gray-500">(任意)</span>
                            </label>
                            <input
                                type="text"
                                placeholder="例：渋谷駅"
                                value={station}
                                onChange={(e) => setStation(e.target.value)}
                                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    {/* ラベル */}
                    <div className="border-b pb-6">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4">ラベル</h2>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                ジャンル <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={genre}
                                onChange={(e) => setGenre(e.target.value)}
                                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                {GENRES.map(g => (
                                    <option key={g} value={g}>{g}</option>
                                ))}
                            </select>
                        </div>

                        <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                都道府県 <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={prefecture}
                                onChange={(e) => setPrefecture(e.target.value)}
                                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                {PREFECTURES.map(p => (
                                    <option key={p} value={p}>{p}</option>
                                ))}
                            </select>
                        </div>

                        <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                季節 <span className="text-red-500">*</span>（複数選択可）
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {SEASONS.map(season => (
                                    <button
                                        key={season}
                                        type="button"
                                        onClick={() => toggleSeason(season)}
                                        className={`px-4 py-2 rounded-lg font-medium transition-all ${selectedSeasons.includes(season)
                                                ? "bg-blue-600 text-white shadow-md"
                                                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                                            }`}
                                    >
                                        {season}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                気分 <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={mood}
                                onChange={(e) => setMood(e.target.value)}
                                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                {MOODS.map(m => (
                                    <option key={m} value={m}>{m}</option>
                                ))}
                            </select>
                        </div>

                        <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                行動 <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                {STATUSES.map(s => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* 行く前のメモ */}
                    <div className="border-b pb-6">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4">行く前のメモ <span className="text-gray-500">(任意)</span></h2>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">メモ</label>
                            <textarea
                                placeholder="行く前のメモを記入"
                                value={beforeMemo}
                                onChange={(e) => setBeforeMemo(e.target.value)}
                                rows={3}
                                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Instagram / 公式サイトURL
                            </label>
                            <input
                                type="url"
                                placeholder="https://..."
                                value={beforeUrl}
                                onChange={(e) => setBeforeUrl(e.target.value)}
                                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    {/* ボタン */}
                    <div className="flex gap-3">
                        <button
                            type="submit"
                            className="flex-1 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-3 font-semibold text-white shadow-lg transition-all hover:shadow-xl hover:scale-105 active:scale-95"
                        >
                            追加
                        </button>
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="rounded-lg border-2 border-gray-300 px-6 py-3 font-semibold text-gray-700 transition-all hover:bg-gray-100 active:scale-95"
                        >
                            キャンセル
                        </button>
                    </div>
                </form>
            </div>
        </main>
    );
}

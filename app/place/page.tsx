"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useMemo } from "react";

export default function WantListPage() {
    const places = useQuery(api.places.list, {});
    const router = useRouter();
    const deletePlace = useMutation(api.places.remove);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedPrefecture, setSelectedPrefecture] = useState("");
    const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
    const [selectedSeasons, setSelectedSeasons] = useState<string[]>([]);
    const [showSearchModal, setShowSearchModal] = useState(false);
    const [showFilterModal, setShowFilterModal] = useState(false);

    const filteredPlaces = useMemo(() => {
        if (!places) return [];
        
        return places.filter(p => {
            const matchesSearch = 
                p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (p.address?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
                (p.genre?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
            
            const matchesPrefecture = !selectedPrefecture || p.prefecture === selectedPrefecture;
            
            const matchesGenre = selectedGenres.length === 0 || (p.genre && selectedGenres.includes(p.genre));
            
            const matchesSeasons = selectedSeasons.length === 0 || 
                (p.seasons && p.seasons.some(s => selectedSeasons.includes(s)));
            
            return matchesSearch && matchesPrefecture && matchesGenre && matchesSeasons;
        });
    }, [places, searchQuery, selectedPrefecture, selectedGenres, selectedSeasons]);

    const prefectures = useMemo(() => {
        if (!places) return [];
        const prefSet = new Set(places.map(p => p.prefecture).filter(Boolean));
        return Array.from(prefSet).sort();
    }, [places]);

    const genres = useMemo(() => {
        if (!places) return [];
        const genreSet = new Set(places.map(p => p.genre).filter(Boolean));
        return Array.from(genreSet).sort();
    }, [places]);

    const seasons = useMemo(() => {
        if (!places) return [];
        const seasonSet = new Set<string>();
        places.forEach(p => {
            p.seasons?.forEach(s => seasonSet.add(s));
        });
        return Array.from(seasonSet).sort();
    }, [places]);

    const handleDelete = async (id: Id<"places">) => {
        if (!confirm("この場所を削除しますか？")) return;
        try {
            await deletePlace({ id });
        } catch {
            alert("削除に失敗しました");
        }
    };


    return (
        <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
            <div className="mx-auto max-w-6xl px-4">
                <div className="mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-3 ml-auto">
                        {/* 検索ボタン */}
                        <button
                            onClick={() => setShowSearchModal(true)}
                            className="rounded-lg bg-gray-200 hover:bg-gray-300 p-2 text-gray-700 transition"
                            title="キーワード検索"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </button>

                        {/* フィルターボタン */}
                        <button
                            onClick={() => setShowFilterModal(true)}
                            className="rounded-lg bg-gray-200 hover:bg-gray-300 p-2 text-gray-700 transition relative"
                            title="都道府県フィルター"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                            </svg>
                            {selectedPrefecture && (
                                <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                    ✓
                                </span>
                            )}
                        </button>

                        <Link
                            href="/place/new"
                            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:shadow-lg"
                        >
                            追加する
                        </Link>
                    </div>
                </div>

                {/* 検索モーダル */}
                {showSearchModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-opacity-50">
                        <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
                            <h2 className="mb-4 text-lg font-semibold text-gray-900">キーワード検索</h2>
                            <input
                                type="text"
                                placeholder="場所名、住所、ジャンルで検索..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                autoFocus
                                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                            <div className="mt-6 flex gap-3">
                                <button
                                    onClick={() => setShowSearchModal(false)}
                                    className="flex-1 rounded-lg border-2 border-gray-300 px-4 py-2 font-semibold text-gray-700 transition hover:bg-gray-100"
                                >
                                    閉じる
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* フィルターモーダル */}
                {showFilterModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-opacity-50">
                        <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg max-h-96 overflow-y-auto">
                            <h2 className="mb-4 text-lg font-semibold text-gray-900">フィルター</h2>
                            
                            {/* 都道府県フィルター */}
                            <div className="mb-6">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    都道府県
                                </label>
                                <select
                                    value={selectedPrefecture}
                                    onChange={(e) => setSelectedPrefecture(e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                >
                                    <option value="">すべて</option>
                                    {prefectures.map(pref => (
                                        <option key={pref} value={pref}>{pref}</option>
                                    ))}
                                </select>
                            </div>

                            {/* ジャンルフィルター */}
                            <div className="mb-6">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    ジャンル
                                </label>
                                <div className="space-y-2">
                                    {genres.filter((g): g is string => Boolean(g)).map(genre => (
                                        <label key={genre} className="flex items-center">
                                            <input
                                                type="checkbox"
                                                checked={selectedGenres.includes(genre)}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setSelectedGenres([...selectedGenres, genre]);
                                                    } else {
                                                        setSelectedGenres(selectedGenres.filter(g => g !== genre));
                                                    }
                                                }}
                                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            />
                                            <span className="ml-2 text-sm text-gray-700">{genre}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* 季節フィルター */}
                            <div className="mb-6">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    季節
                                </label>
                                <div className="space-y-2">
                                    {seasons.map(season => (
                                        <label key={season} className="flex items-center">
                                            <input
                                                type="checkbox"
                                                checked={selectedSeasons.includes(season)}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setSelectedSeasons([...selectedSeasons, season]);
                                                    } else {
                                                        setSelectedSeasons(selectedSeasons.filter(s => s !== season));
                                                    }
                                                }}
                                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            />
                                            <span className="ml-2 text-sm text-gray-700">{season}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        setSelectedPrefecture("");
                                        setSelectedGenres([]);
                                        setSelectedSeasons([]);
                                    }}
                                    className="flex-1 rounded-lg border-2 border-gray-300 px-4 py-2 font-semibold text-gray-700 transition hover:bg-gray-100"
                                >
                                    リセット
                                </button>
                                <button
                                    onClick={() => setShowFilterModal(false)}
                                    className="flex-1 rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white transition hover:bg-blue-700"
                                >
                                    閉じる
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {!filteredPlaces?.length && (
                    <div className="rounded-xl border border-dashed border-gray-300 bg-white p-6 text-center text-gray-600">
                        {places?.length === 0 
                            ? "まだ行きたい場所がありません。追加してみましょう。"
                            : "検索条件に一致する場所がありません。"
                        }
                    </div>
                )}

                <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                    {filteredPlaces?.map(p => (
                        <div key={p._id} className="relative rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                            <button
                                onClick={() => handleDelete(p._id)}
                                className="absolute top-2 right-2 text-gray-400 hover:text-red-500 transition p-1"
                                title="削除"
                            >
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                            </button>
                            <Link href={`/place/${p._id}/detail`} className="block hover:opacity-90">
                                <h3 className="text-lg font-semibold text-gray-900">{p.title}</h3>
                                <p className="mt-1 text-sm text-gray-600">{p.address ?? "住所未設定"}</p>
                                <p className="mt-1 text-xs text-gray-500">{p.genre ?? "ジャンル未設定"}</p>
                            </Link>
                            <div className="mt-4 flex gap-2">
                                <button
                                    className="flex-1 rounded-lg bg-gradient-to-r from-green-500 to-green-600 px-3 py-2 text-sm font-semibold text-white shadow-md transition hover:shadow-lg hover:scale-105 active:scale-95"
                                    onClick={() => router.push(`/place/${p._id}/detail/feedback`)}
                                >
                                    行った！
                                </button>
                                <Link
                                    href={`/place/${p._id}/detail`}
                                    className="rounded-lg border-2 border-gray-200 px-3 py-2 text-center text-sm font-semibold text-gray-700 shadow-sm transition hover:border-gray-400 hover:bg-gray-100 active:scale-95"
                                >
                                    詳細
                                </Link>
                                <Link
                                    href={`/place/${p._id}/edit`}
                                    className="rounded-lg border-2 border-gray-200 px-3 py-2 text-center text-sm font-semibold text-gray-700 shadow-sm transition hover:border-gray-400 hover:bg-gray-100 active:scale-95"
                                >
                                    編集
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </main>
    );
}

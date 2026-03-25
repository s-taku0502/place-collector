"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useMemo } from "react";
import RegionFilter from "@/components/RegionFilter";
import { PREFECTURES } from "@/lib/constants";
import { useEffect } from "react";

export default function WantListPage() {
    const places = useQuery(api.places.list, {});
    const router = useRouter();
    const deletePlace = useMutation(api.places.remove);
    const [searchQuery, setSearchQuery] = useState("");
    // region filtering: select multiple prefectures and classification
    const [selectedRegionClass, setSelectedRegionClass] = useState<"A"|"B"|"C">("A");
    const [selectedPrefectures, setSelectedPrefectures] = useState<string[]>([]);
    const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
    const [selectedSeasons, setSelectedSeasons] = useState<string[]>([]);
    const [showSearchModal, setShowSearchModal] = useState(false);
    const [showFilterModal, setShowFilterModal] = useState(false);

    useEffect(() => {
        function onKey(e: KeyboardEvent) {
            if (e.key === "Escape" && showFilterModal) setShowFilterModal(false);
        }
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [showFilterModal]);

    const filteredPlaces = useMemo(() => {
        if (!places) return [];

        return places.filter((p: any) => {
            const matchesSearch =
                p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (p.address?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
                (p.genre?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
            const matchesRegion =
                selectedPrefectures.length === 0 ||
                (p.prefecture && selectedPrefectures.includes(p.prefecture));
            const matchesGenre = selectedGenres.length === 0 || (p.genre && selectedGenres.includes(p.genre));
            const matchesSeasons = selectedSeasons.length === 0 ||
                (p.seasons && p.seasons.some((s: string) => selectedSeasons.includes(s)));
            return matchesSearch && matchesRegion && matchesGenre && matchesSeasons;
        });
    }, [places, searchQuery, selectedPrefectures, selectedGenres, selectedSeasons]);

    // region groupings for three classification variants (A/B/C)
    const regionGroups = useMemo(() => {
        const A: Record<string, string[]> = {
            "北海道": ["北海道"],
            "東北": ["青森県","岩手県","秋田県","宮城県","山形県","福島県","新潟県"],
            "関東": ["茨城県","栃木県","群馬県","山梨県","長野県","埼玉県","千葉県","東京都","神奈川県"],
            "東海": ["静岡県","岐阜県","愛知県","三重県"],
            "北陸": ["富山県","石川県","福井県"],
            "近畿": ["滋賀県","京都府","奈良県","和歌山県","大阪府","兵庫県"],
            "中国": ["鳥取県","島根県","岡山県","広島県","山口県"],
            "四国": ["徳島県","香川県","愛媛県","高知県"],
            "九州": ["福岡県","佐賀県","長崎県","大分県","熊本県","宮崎県","鹿児島県"],
            "沖縄": ["沖縄県"],
        };
        const B = JSON.parse(JSON.stringify(A)) as Record<string,string[]>;
        // B: 新潟、静岡を関東へ、福井を近畿へ
        B["東北"] = B["東北"].filter(p => p !== "新潟県");
        B["関東"].push("新潟県");
        B["東海"] = B["東海"].filter(p => p !== "静岡県");
        B["関東"].push("静岡県");
        B["北陸"] = B["北陸"].filter(p => p !== "福井県");
        B["近畿"].push("福井県");

        const C: Record<string,string[]> = {
            "北海道": ["北海道"],
            "東北": ["青森県","岩手県","秋田県","宮城県","山形県","福島県"],
            "関東": ["茨城県","栃木県","群馬県","山梨県","長野県","埼玉県","千葉県","東京都","神奈川県"],
            "東海": ["静岡県","岐阜県","愛知県","三重県"],
            "北陸": ["新潟県","富山県","石川県","福井県"],
            "近畿": ["滋賀県","京都府","奈良県","和歌山県","大阪府","兵庫県"],
            "中国": ["鳥取県","島根県","岡山県","広島県","山口県"],
            "四国": ["徳島県","香川県","愛媛県","高知県"],
            "九州": ["福岡県","佐賀県","長崎県","大分県","熊本県","宮崎県","鹿児島県"],
            "沖縄": ["沖縄県"],
        };
        return { A, B, C } as const;
    }, []);

    const genres = useMemo(() => {
        if (!places) return [];
            const genreList = (places.map((p: any) => p.genre) as Array<string | undefined>).filter(Boolean) as string[];
            const genreSet = new Set<string>(genreList);
        return Array.from(genreSet).sort();
    }, [places]);

    // seasons extraction
    const seasons = useMemo(() => {
        if (!places) return [];
        const seasonSet = new Set<string>();
        places.forEach((p: any) => {
            p.seasons?.forEach((s: any) => seasonSet.add(s));
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
                                    検索
                                </button>
                            </div>
                        </div>
                    </div>

                {/* スライドオーバー型フィルター（モダンUI） */}
                {showFilterModal && (
                    <div className="fixed inset-0 z-50 flex">
                        <div className="fixed inset-0 bg-black bg-opacity-40" onClick={() => setShowFilterModal(false)} />
                        <aside className="ml-auto w-full max-w-md h-full bg-white shadow-xl p-6 overflow-y-auto">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-semibold">フィルター</h2>
                                <button onClick={() => setShowFilterModal(false)} className="text-gray-600 hover:text-gray-900">✕</button>
                            </div>
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">地域（分類）</label>
                                    <RegionFilter
                                        regionClass={selectedRegionClass}
                                        setRegionClass={setSelectedRegionClass}
                                        selectedPrefectures={selectedPrefectures}
                                        setSelectedPrefectures={setSelectedPrefectures}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">ジャンル</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {genres.filter((g): g is string => Boolean(g)).map(genre => (
                                            <label key={genre} className="flex items-center gap-2 p-2 border rounded hover:bg-gray-50">
                                                <input type="checkbox" checked={selectedGenres.includes(genre)} onChange={(e) => {
                                                    if (e.target.checked) setSelectedGenres([...selectedGenres, genre]);
                                                    else setSelectedGenres(selectedGenres.filter(g => g !== genre));
                                                }} className="w-4 h-4" />
                                                <span className="text-sm text-gray-700">{genre}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">季節</label>
                                    <div className="flex flex-wrap gap-2">
                                        {seasons.map(season => (
                                            <label key={season} className="inline-flex items-center gap-2 p-2 border rounded hover:bg-gray-50">
                                                <input type="checkbox" checked={selectedSeasons.includes(season)} onChange={(e) => {
                                                    if (e.target.checked) setSelectedSeasons([...selectedSeasons, season]);
                                                    else setSelectedSeasons(selectedSeasons.filter(s => s !== season));
                                                }} className="w-4 h-4" />
                                                <span className="text-sm text-gray-700">{season}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <button onClick={() => {
                                        setSelectedRegionClass("A");
                                        setSelectedPrefectures([]);
                                        setSelectedGenres([]);
                                        setSelectedSeasons([]);
                                    }} className="flex-1 rounded-lg border-2 border-gray-300 px-4 py-2 font-semibold text-gray-700">リセット</button>
                                    <button onClick={() => setShowFilterModal(false)} className="flex-1 rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white">適用</button>
                                </div>
                            </div>
                        </aside>
                    </div>
                )}

                {/* フローティング絞り込みボタン */}
                <button
                    onClick={() => setShowFilterModal(true)}
                    aria-label="フィルターを開く"
                    className="fixed bottom-8 right-8 z-40 inline-flex items-center gap-2 rounded-full bg-white p-3 shadow-lg hover:shadow-2xl transition"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L14 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 018 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
                    </svg>
                    <span className="hidden sm:inline text-sm font-medium">絞り込み</span>
                </button>

                {!filteredPlaces?.length && (
                    <div className="rounded-xl border border-dashed border-gray-300 bg-white p-6 text-center text-gray-600">
                        {places?.length === 0
                            ? "まだ行きたい場所がありません。追加してみましょう。"
                            : "検索条件に一致する場所がありません。"
                        }
                    </div>
                )}

                <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                    {filteredPlaces?.map((p: any) => (
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
    )
}
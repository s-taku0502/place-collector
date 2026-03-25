"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useMemo, useEffect } from "react";
import RegionFilter from "@/components/RegionFilter";

type VisitFilter = "all" | "visited" | "unvisited";

export default function WantListPage() {
    const places = useQuery(api.places.list, {});
    const router = useRouter();
    const deletePlace = useMutation(api.places.remove);
    
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedRegionClass, setSelectedRegionClass] = useState<"A"|"B"|"C">("A");
    const [selectedPrefectures, setSelectedPrefectures] = useState<string[]>([]);
    const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
    const [selectedSeasons, setSelectedSeasons] = useState<string[]>([]);
    const [visitFilter, setVisitFilter] = useState<VisitFilter>("all");
    
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
                (p.title?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
                (p.address?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
                (p.genre?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
            
            const matchesRegion =
                selectedPrefectures.length === 0 ||
                (p.prefecture && selectedPrefectures.includes(p.prefecture));
            
            const matchesGenre = selectedGenres.length === 0 || (p.genre && selectedGenres.includes(p.genre));
            
            const matchesSeasons = selectedSeasons.length === 0 ||
                (p.seasons && p.seasons.some((s: string) => selectedSeasons.includes(s)));
            
            const matchesVisit = 
                visitFilter === "all" || 
                (visitFilter === "visited" && p.visited) || 
                (visitFilter === "unvisited" && !p.visited);

            return matchesSearch && matchesRegion && matchesGenre && matchesSeasons && matchesVisit;
        });
    }, [places, searchQuery, selectedPrefectures, selectedGenres, selectedSeasons, visitFilter]);

    const genres = useMemo(() => {
        if (!places) return [];
        const genreList = (places.map((p: any) => p.genre) as Array<string | undefined>).filter(Boolean) as string[];
        const genreSet = new Set<string>(genreList);
        return Array.from(genreSet).sort();
    }, [places]);

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

    if (places === undefined) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-gray-50 py-8 px-4">
            <div className="mx-auto max-w-6xl">
                {/* ヘッダーエリア */}
                <div className="mb-8 space-y-4">
                    <h1 className="text-3xl font-bold text-gray-900">場所一覧</h1>
                    
                    <div className="flex flex-col md:flex-row gap-4">
                        {/* 検索バー */}
                        <div className="relative flex-1">
                            <input
                                type="text"
                                placeholder="場所名、住所、ジャンルで検索..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full rounded-xl border border-gray-200 bg-white pl-10 pr-4 py-3 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                            />
                            <svg className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>

                        {/* 訪問ステータスフィルター */}
                        <div className="flex bg-white p-1 rounded-xl shadow-sm border border-gray-200">
                            {(["all", "visited", "unvisited"] as VisitFilter[]).map((f) => (
                                <button
                                    key={f}
                                    onClick={() => setVisitFilter(f)}
                                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                                        visitFilter === f 
                                        ? 'bg-blue-600 text-white shadow-md' 
                                        : 'text-gray-500 hover:bg-gray-50'
                                    }`}
                                >
                                    {f === "all" ? "すべて" : f === "visited" ? "行った" : "未訪問"}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* リスト表示 */}
                <div className="mb-4 flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-500">
                        {filteredPlaces.length} 件の場所が見つかりました
                    </p>
                </div>

                {filteredPlaces.length === 0 ? (
                    <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-white p-12 text-center">
                        <div className="mx-auto w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                            <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        </div>
                        <p className="text-gray-600 font-medium">
                            {places.length === 0 ? "まだ場所が登録されていません。" : "条件に一致する場所がありません。"}
                        </p>
                        {places.length > 0 && (
                            <button 
                                onClick={() => {
                                    setSearchQuery("");
                                    setSelectedPrefectures([]);
                                    setSelectedGenres([]);
                                    setSelectedSeasons([]);
                                    setVisitFilter("all");
                                }}
                                className="mt-4 text-blue-600 font-bold hover:underline"
                            >
                                フィルターをリセット
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {filteredPlaces.map((p: any) => (
                            <div key={p._id} className="group relative rounded-2xl border border-gray-100 bg-white p-5 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                                <button
                                    onClick={() => handleDelete(p._id)}
                                    className="absolute top-4 right-4 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                    title="削除"
                                >
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                </button>
                                
                                <Link href={`/place/${p._id}/detail`} className="block">
                                    <div className="flex items-start justify-between mb-2">
                                        <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">{p.title}</h3>
                                    </div>
                                    <p className="text-sm text-gray-500 line-clamp-2 min-h-[2.5rem] mb-3 leading-relaxed">
                                        {p.address ?? "住所未設定"}
                                    </p>
                                    <div className="flex flex-wrap gap-2 mb-4">
                                        {p.genre && (
                                            <span className="text-[10px] px-2 py-1 rounded-full bg-blue-50 text-blue-600 font-bold uppercase tracking-wider">
                                                {p.genre}
                                            </span>
                                        )}
                                        {p.prefecture && (
                                            <span className="text-[10px] px-2 py-1 rounded-full bg-gray-100 text-gray-500 font-bold">
                                                📍 {p.prefecture}
                                            </span>
                                        )}
                                    </div>
                                </Link>

                                <div className="flex gap-2 mt-auto pt-4 border-t border-gray-50">
                                    <button
                                        className={`flex-1 rounded-xl py-2.5 text-sm font-bold text-white shadow-md transition-all active:scale-95 ${
                                            p.visited 
                                            ? 'bg-gray-400 cursor-not-allowed' 
                                            : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'
                                        }`}
                                        onClick={() => !p.visited && router.push(`/place/${p._id}/detail/feedback`)}
                                        disabled={p.visited}
                                    >
                                        {p.visited ? '訪問済み' : '行った！'}
                                    </button>
                                    <Link
                                        href={`/place/${p._id}/edit`}
                                        className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors active:scale-95"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* フローティング絞り込みボタン */}
                <button
                    onClick={() => setShowFilterModal(true)}
                    className="fixed bottom-8 right-8 z-40 flex items-center gap-2 rounded-full bg-blue-600 px-6 py-4 text-white shadow-2xl hover:bg-blue-700 transition-all hover:scale-105 active:scale-95"
                >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L14 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 018 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
                    </svg>
                    <span className="font-bold">絞り込み</span>
                    {(selectedPrefectures.length > 0 || selectedGenres.length > 0 || selectedSeasons.length > 0) && (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-[10px] font-bold text-blue-600">
                            {selectedPrefectures.length + selectedGenres.length + selectedSeasons.length}
                        </span>
                    )}
                </button>

                {/* フィルターモーダル */}
                {showFilterModal && (
                    <div className="fixed inset-0 z-50 flex justify-end">
                        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={() => setShowFilterModal(false)} />
                        <aside className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-slide-in-right">
                            <div className="p-6 border-b flex items-center justify-between">
                                <h2 className="text-xl font-bold text-gray-900">フィルター</h2>
                                <button onClick={() => setShowFilterModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition">
                                    <svg className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            
                            <div className="flex-1 overflow-y-auto p-6 space-y-8">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-3">地域（分類）</label>
                                    <RegionFilter
                                        regionClass={selectedRegionClass}
                                        setRegionClass={setSelectedRegionClass}
                                        selectedPrefectures={selectedPrefectures}
                                        setSelectedPrefectures={setSelectedPrefectures}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-3">ジャンル</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {genres.map(genre => (
                                            <label key={genre} className={`flex items-center gap-2 p-3 border rounded-xl cursor-pointer transition-all ${selectedGenres.includes(genre) ? 'bg-blue-50 border-blue-200 text-blue-700' : 'hover:bg-gray-50 border-gray-100 text-gray-600'}`}>
                                                <input 
                                                    type="checkbox" 
                                                    checked={selectedGenres.includes(genre)} 
                                                    onChange={(e) => {
                                                        if (e.target.checked) setSelectedGenres([...selectedGenres, genre]);
                                                        else setSelectedGenres(selectedGenres.filter(g => g !== genre));
                                                    }} 
                                                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500" 
                                                />
                                                <span className="text-sm font-medium">{genre}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {seasons.length > 0 && (
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-3">季節</label>
                                        <div className="flex flex-wrap gap-2">
                                            {seasons.map(season => (
                                                <label key={season} className={`flex items-center gap-2 p-3 border rounded-xl cursor-pointer transition-all ${selectedSeasons.includes(season) ? 'bg-orange-50 border-orange-200 text-orange-700' : 'hover:bg-gray-50 border-gray-100 text-gray-600'}`}>
                                                    <input 
                                                        type="checkbox" 
                                                        checked={selectedSeasons.includes(season)} 
                                                        onChange={(e) => {
                                                            if (e.target.checked) setSelectedSeasons([...selectedSeasons, season]);
                                                            else setSelectedSeasons(selectedSeasons.filter(s => s !== season));
                                                        }} 
                                                        className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500" 
                                                    />
                                                    <span className="text-sm font-medium">{season}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="p-6 border-t bg-gray-50 flex gap-3">
                                <button 
                                    onClick={() => {
                                        setSelectedRegionClass("A");
                                        setSelectedPrefectures([]);
                                        setSelectedGenres([]);
                                        setSelectedSeasons([]);
                                        setVisitFilter("all");
                                    }} 
                                    className="flex-1 py-3 px-4 rounded-xl border border-gray-200 bg-white font-bold text-gray-600 hover:bg-gray-100 transition"
                                >
                                    リセット
                                </button>
                                <button 
                                    onClick={() => setShowFilterModal(false)} 
                                    className="flex-1 py-3 px-4 rounded-xl bg-blue-600 font-bold text-white hover:bg-blue-700 shadow-lg shadow-blue-200 transition"
                                >
                                    適用する
                                </button>
                            </div>
                        </aside>
                    </div>
                )}
            </div>

            <style jsx global>{`
                @keyframes slide-in-right { from { transform: translateX(100%); } to { transform: translateX(0); } }
                .animate-slide-in-right { animation: slide-in-right 0.3s ease-out; }
            `}</style>
        </main>
    );
}

"use client";

import { useState } from "react";
import {
    PREFECTURES,
    GENRES,
    SEASONS,
    MOODS,
    // STATUSES,
    DEFAULT_PREFECTURE_INDEX,
    DEFAULT_GENRE_INDEX,
    DEFAULT_MOOD_INDEX,
    // DEFAULT_STATUS_INDEX,
} from "../lib/constants";

export type PlaceFormValues = {
    title: string;
    address: string;
    station?: string;
    genre: string;
    prefecture: string;
    seasons: string[];
    mood: string;
    // status: string;
    beforeMemo?: string;
    beforeUrl?: string;
};

export function getDefaultPlaceFormValues(): PlaceFormValues {
    return {
        title: "",
        address: "",
        station: "",
        genre: GENRES[DEFAULT_GENRE_INDEX],
        prefecture: PREFECTURES[DEFAULT_PREFECTURE_INDEX],
        seasons: [],
        mood: MOODS[DEFAULT_MOOD_INDEX],
        beforeMemo: "",
        beforeUrl: "",
    };
}

function extractPrefectureFromAddress(addressText: string): string {
    for (const pref of PREFECTURES) {
        if (addressText.startsWith(pref)) return pref;
    }
    return PREFECTURES[DEFAULT_PREFECTURE_INDEX];
}

export type PlaceFormErrors = {
    title?: string;
    address?: string;
    seasons?: string;
};

function validateForm(values: PlaceFormValues): PlaceFormErrors {
    const errors: PlaceFormErrors = {};

    if (!values.title.trim()) {
        errors.title = "名称は必須です";
    }

    if (!values.address.trim()) {
        errors.address = "住所は必須です";
    }

    if (!values.seasons.length) {
        errors.seasons = "季節を選択してください";
    }

    return errors;
}

interface PlaceFormProps {
    initialValues?: Partial<PlaceFormValues>;
    onSubmit: (values: PlaceFormValues) => Promise<void> | void;
    submitLabel: string;
    onCancel?: () => void;
}

export default function PlaceForm({
    initialValues,
    onSubmit,
    submitLabel,
    onCancel,
}: PlaceFormProps) {

    const [title, setTitle] = useState(initialValues?.title ?? "");
    const [isSearching, setIsSearching] = useState(false);
    const [searchError, setSearchError] = useState<string | null>(null);
    const [address, setAddress] = useState(initialValues?.address ?? "");
    const [station, setStation] = useState(initialValues?.station ?? "");
    const [genre, setGenre] = useState(initialValues?.genre ?? GENRES[DEFAULT_GENRE_INDEX]);
    const [prefecture, setPrefecture] = useState(initialValues?.prefecture ?? PREFECTURES[DEFAULT_PREFECTURE_INDEX]);
    const [selectedSeasons, setSelectedSeasons] = useState<string[]>(initialValues?.seasons ?? []);
    const [mood, setMood] = useState(initialValues?.mood ?? MOODS[DEFAULT_MOOD_INDEX]);
    // const [status, setStatus] = useState(initialValues?.status ?? STATUSES[DEFAULT_STATUS_INDEX]);
    const [beforeMemo, setBeforeMemo] = useState(initialValues?.beforeMemo ?? "");
    const [beforeUrl, setBeforeUrl] = useState(initialValues?.beforeUrl ?? "");
    const [errors, setErrors] = useState<PlaceFormErrors>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const toggleSeason = (season: string) => {
        setSelectedSeasons(prev =>
            prev.includes(season) ? prev.filter(s => s !== season) : [...prev, season]
        );
    };

    // Google Maps Places APIで名称検索し、情報取得
    const handleSearchPlace = async () => {
        setIsSearching(true);
        setSearchError(null);
        try {
            const res = await fetch(`/api/search-place?query=${encodeURIComponent(title)}`);
            if (!res.ok) {
                setSearchError("検索APIの呼び出しに失敗しました");
                setIsSearching(false);
                return;
            }
            const data = await res.json();
            // Google Places APIの仕様に準拠したレスポンスチェック
            if (data.status && data.status !== "OK") {
                setSearchError(`Google Places APIエラー: ${data.status}`);
                setIsSearching(false);
                return;
            }
            if (!data.results || !Array.isArray(data.results) || data.results.length === 0) {
                setSearchError("該当する場所が見つかりませんでした");
                setIsSearching(false);
                return;
            }
            const place = data.results[0];

            // name, formatted_address, types などGoogle公式仕様で取得
            if (typeof place.name === "string" && place.name.length > 0) {
                setTitle(place.name);
            }
            setAddress(typeof place.formatted_address === "string" ? place.formatted_address : "");

            // 都道府県自動推定
            if (typeof place.formatted_address === "string") {
                const pref = extractPrefectureFromAddress(place.formatted_address);
                setPrefecture(pref);
            }

            // ジャンル自動推定（Googleのtypes配列とGENRESの簡易マッピング）
            if (Array.isArray(place.types)) {
                const typeGenreMap: { [key: string]: string } = {
                    restaurant: "飲食店",
                    cafe: "飲食店",
                    food: "飲食店",
                    bakery: "飲食店",
                    bar: "飲食店",
                    meal_takeaway: "飲食店",
                    museum: "美術館",
                    art_gallery: "美術館",
                    park: "公園",
                    spa: "温泉",
                    store: "ショップ",
                    shopping_mall: "ショップ",
                    clothing_store: "ショップ",
                    amusement_park: "レジャー",
                    zoo: "レジャー",
                    aquarium: "レジャー",
                    tourist_attraction: "観光地",
                    shrine: "観光地",
                    church: "観光地",
                    temple: "観光地",
                };
                let matchedGenre = "";
                for (const t of place.types) {
                    if (typeGenreMap[t]) {
                        matchedGenre = typeGenreMap[t];
                        break;
                    }
                }
                if (matchedGenre && GENRES.includes(matchedGenre)) {
                    setGenre(matchedGenre);
                }
            }

            // 季節の自動推定（特定のキーワードが含まれる場合）
            const titleAndAddress = ((place.name || "") + (place.formatted_address || "")).toLowerCase();
            if (titleAndAddress.includes("桜") || titleAndAddress.includes("花見") || titleAndAddress.includes("sakura")) {
                if (!selectedSeasons.includes("春")) setSelectedSeasons(prev => [...prev, "春"]);
            }
            if (titleAndAddress.includes("海") || titleAndAddress.includes("プール") || titleAndAddress.includes("夏祭り")) {
                if (!selectedSeasons.includes("夏")) setSelectedSeasons(prev => [...prev, "夏"]);
            }
            if (titleAndAddress.includes("紅葉") || titleAndAddress.includes("もみじ")) {
                if (!selectedSeasons.includes("秋")) setSelectedSeasons(prev => [...prev, "秋"]);
            }
            if (titleAndAddress.includes("スキー") || titleAndAddress.includes("スノボ") || titleAndAddress.includes("イルミネーション")) {
                if (!selectedSeasons.includes("冬")) setSelectedSeasons(prev => [...prev, "冬"]);
            }

            // デフォルトで「通年」をチェック（何もヒットしなかった場合や一般的な場所）
            if (selectedSeasons.length === 0) {
                setSelectedSeasons(["通年"]);
            }
        } catch (err) {
            setSearchError("検索中にエラーが発生しました");
            console.error(err);
        } finally {
            setIsSearching(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const values: PlaceFormValues = {
            title: title.trim(),
            address: address.trim(),
            station: station.trim() || undefined,
            genre,
            prefecture,
            seasons: selectedSeasons,
            mood,
            // status,
            beforeMemo: beforeMemo.trim() || undefined,
            beforeUrl: beforeUrl.trim() || undefined,
        };

        const formErrors = validateForm(values);

        if (Object.keys(formErrors).length > 0) {
            setErrors(formErrors);
            return;
        }

        setErrors({});
        setIsSubmitting(true);
        try {
            await onSubmit(values);
        } catch (err) {
            alert("保存に失敗しました");
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 bg-white rounded-xl p-6 shadow-lg">
            {/* 基本情報 */}
            <div className="border-b pb-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">基本情報</h2>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        名称 <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            placeholder="例：〇〇カフェ"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className={`flex-1 rounded-md border px-3 py-2 focus:outline-none focus:ring-2 ${errors.title
                                    ? "border-red-500 focus:ring-red-500"
                                    : "border-gray-300 focus:ring-blue-500"
                                }`}
                        />
                        <button
                            type="button"
                            onClick={handleSearchPlace}
                            disabled={isSearching || !title.trim()}
                            className={`rounded-lg px-4 py-2 font-semibold transition-all ${isSearching || !title.trim()
                                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                    : "bg-blue-600 text-white hover:bg-blue-700"
                                }`}
                        >
                            {isSearching ? "検索中..." : "名称で検索"}
                        </button>
                    </div>
                    {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
                    {searchError && <p className="mt-1 text-sm text-red-600">{searchError}</p>}
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
                            const newPref = extractPrefectureFromAddress(e.target.value);
                            setPrefecture(newPref);
                        }}
                        className={`w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 ${errors.address
                                ? "border-red-500 focus:ring-red-500"
                                : "border-gray-300 focus:ring-blue-500"
                            }`}
                    />
                    {errors.address && <p className="mt-1 text-sm text-red-600">{errors.address}</p>}
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
                        {GENRES.map((g: string) => (
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
                        {PREFECTURES.map((p: string) => (
                            <option key={p} value={p}>{p}</option>
                        ))}
                    </select>
                </div>

                <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        季節 <span className="text-red-500">*</span>（複数選択可）
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {SEASONS.map((season: string) => (
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
                    {errors.seasons && <p className="mt-1 text-sm text-red-600">{errors.seasons}</p>}
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
                        {MOODS.map((m: string) => (
                            <option key={m} value={m}>{m}</option>
                        ))}
                    </select>
                </div>

                {/* <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        行動 <span className="text-red-500">*</span>
                    </label>
                    <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        {STATUSES.map((s: string) => (
                            <option key={s} value={s}>{s}</option>
                        ))}
                    </select>
                </div> */}
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
                    disabled={isSubmitting}
                    className={`flex-1 rounded-lg px-6 py-3 font-semibold shadow-lg transition-all ${isSubmitting
                            ? "bg-gray-400 text-white cursor-not-allowed opacity-70"
                            : "bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:shadow-xl hover:scale-105 active:scale-95"
                        }`}
                >
                    {isSubmitting ? "保存中…" : submitLabel}
                </button>
                {onCancel && (
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={isSubmitting}
                        className={`rounded-lg border-2 px-6 py-3 font-semibold transition-all ${isSubmitting
                                ? "border-gray-200 text-gray-400 cursor-not-allowed"
                                : "border-gray-300 text-gray-700 hover:bg-gray-100 active:scale-95"
                            }`}
                    >
                        キャンセル
                    </button>
                )}
            </div>
        </form>
    );
}

"use client";

// Gemini APIによる判別
import { fetchGeminiLocationResult } from "../lib/googleGemini";

import { useState, useEffect, useRef } from "react";
declare module "react" {
    interface IntrinsicElements {
        "gmpx-place-picker": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
            placeholder?: string;
            class?: string;
            style?: React.CSSProperties;
        };
    }
}
import {
    PREFECTURES,
    GENRES,
    SEASONS,
    MOODS,
    DEFAULT_PREFECTURE_INDEX,
    DEFAULT_GENRE_INDEX,
    DEFAULT_MOOD_INDEX,
} from "../lib/constants";
import { INTERNATIONAL_TYPES, COUNTRIES } from "../lib/countries";



export type PlaceFormValues = {
    title: string;
    address: string;
    station?: string;
    genre: string;
    internationalType: string; // "日本" or "海外"
    region: string; // 都道府県 or 国名
    seasons: string[];
    mood: string;
    beforeMemo?: string;
    beforeUrl?: string;
};

export function getDefaultPlaceFormValues(): PlaceFormValues {
    return {
        title: "",
        address: "",
        station: "",
        genre: GENRES[DEFAULT_GENRE_INDEX],
        internationalType: INTERNATIONAL_TYPES[0], // "日本"
        region: PREFECTURES[DEFAULT_PREFECTURE_INDEX],
        seasons: [],
        mood: MOODS[DEFAULT_MOOD_INDEX],
        beforeMemo: "",
        beforeUrl: "",
    };
}

function extractPrefectureFromAddress(addressText: string): string | undefined {
    for (const pref of PREFECTURES) {
        if (addressText.includes(pref)) return pref;
    }
    return undefined;
}

function extractCountryFromAddress(addressText: string): string | undefined {
    for (const country of COUNTRIES) {
        if (addressText.includes(country)) return country;
    }
    return undefined;
}

function autoDetectInternationalTypeAndRegion(addressText: string): { internationalType: string, region: string } {
    // 住所をカンマや空白で分割し、最終項目を取得
    const parts = addressText.split(/,|\s/).map(s => s.trim()).filter(Boolean);
    let last = parts.length > 0 ? parts[parts.length - 1] : "";

    // 最終項目が国名リストに含まれていればそれをregionに
    if (last && COUNTRIES.includes(last)) {
        return { internationalType: "海外", region: last };
    }

    // 都道府県が含まれていれば日本
    const pref = extractPrefectureFromAddress(addressText);
    if (pref) {
        return { internationalType: "日本", region: pref };
    }

    // 国名がどこかに含まれていれば海外
    const country = extractCountryFromAddress(addressText);
    if (country) {
        return { internationalType: "海外", region: country };
    }

    // どちらも該当しない場合はデフォルト
    return { internationalType: INTERNATIONAL_TYPES[0], region: PREFECTURES[DEFAULT_PREFECTURE_INDEX] };
}

export type PlaceFormErrors = {
    title?: string;
    address?: string;
    seasons?: string;
    region?: string;
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

    if (!values.region?.trim()) {
        errors.region = values.internationalType === "日本" ? "都道府県を選択してください" : "国名を選択してください";
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
    const [address, setAddress] = useState(initialValues?.address ?? "");
    const [station, setStation] = useState(initialValues?.station ?? "");
    const [genre, setGenre] = useState(initialValues?.genre ?? GENRES[DEFAULT_GENRE_INDEX]);
    const [internationalType, setInternationalType] = useState(initialValues?.internationalType ?? INTERNATIONAL_TYPES[0]);
    const [region, setRegion] = useState(initialValues?.region ?? PREFECTURES[DEFAULT_PREFECTURE_INDEX]);
    // const [autoDetected, setAutoDetected] = useState(false); // 未使用のため削除
    const [isGeminiLoading, setIsGeminiLoading] = useState(false);
    const [geminiError, setGeminiError] = useState<string | null>(null);
    const [selectedSeasons, setSelectedSeasons] = useState<string[]>(initialValues?.seasons ?? []);
    const [mood, setMood] = useState(initialValues?.mood ?? MOODS[DEFAULT_MOOD_INDEX]);
    const [beforeMemo, setBeforeMemo] = useState(initialValues?.beforeMemo ?? "");
    const [beforeUrl, setBeforeUrl] = useState(initialValues?.beforeUrl ?? "");
    const [errors, setErrors] = useState<PlaceFormErrors>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const pickerRef = useRef<HTMLElement>(null);

    useEffect(() => {
        const picker = pickerRef.current;
        if (!picker) return;

        const handlePlaceChange = () => {
            let place: unknown = undefined;
            if (picker && "value" in picker) {
                place = (picker as { value?: unknown }).value;
            }
            if (!place || typeof place !== "object" || place === null) return;
            const obj = place as Record<string, unknown>;

            // 名称の設定
            if (typeof obj.displayName === "string") {
                setTitle(obj.displayName);
            } else if (typeof obj.name === "string") {
                setTitle(obj.name);
            }

            // 住所の設定
            if (typeof obj.formattedAddress === "string") {
                setAddress(obj.formattedAddress);
                const detected = autoDetectInternationalTypeAndRegion(obj.formattedAddress);
                setInternationalType(detected.internationalType);
                setRegion(detected.region);
            }

            // ジャンル自動推定
            if (Array.isArray(obj.types)) {
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
                for (const t of obj.types) {
                    if (typeof t === "string" && typeGenreMap[t]) {
                        matchedGenre = typeGenreMap[t];
                        break;
                    }
                }
                if (matchedGenre && GENRES.includes(matchedGenre)) {
                    setGenre(matchedGenre);
                }
            }

            // 季節の自動推定
            const titleAndAddress = ((typeof obj.displayName === "string" ? obj.displayName : typeof obj.name === "string" ? obj.name : "") + (typeof obj.formattedAddress === "string" ? obj.formattedAddress : "")).toLowerCase();
            const newSeasons: string[] = [];
            if (titleAndAddress.includes("桜") || titleAndAddress.includes("花見") || titleAndAddress.includes("sakura")) {
                newSeasons.push("春");
            }
            if (titleAndAddress.includes("海") || titleAndAddress.includes("プール") || titleAndAddress.includes("夏祭り")) {
                newSeasons.push("夏");
            }
            if (titleAndAddress.includes("紅葉") || titleAndAddress.includes("もみじ")) {
                newSeasons.push("秋");
            }
            if (titleAndAddress.includes("スキー") || titleAndAddress.includes("スノボ") || titleAndAddress.includes("イルミネーション")) {
                newSeasons.push("冬");
            }

            if (newSeasons.length > 0) {
                setSelectedSeasons(newSeasons);
            } else {
                setSelectedSeasons(["通年"]);
            }
        };

        picker.addEventListener("gmpx-placechange", handlePlaceChange);
        return () => {
            picker.removeEventListener("gmpx-placechange", handlePlaceChange);
        };
    }, [internationalType]);

    const toggleSeason = (season: string) => {
        setSelectedSeasons(prev =>
            prev.includes(season) ? prev.filter(s => s !== season) : [...prev, season]
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const values: PlaceFormValues = {
            title: title.trim(),
            address: address.trim(),
            station: station.trim() || undefined,
            genre,
            internationalType,
            region,
            seasons: selectedSeasons,
            mood,
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
                    <div className="space-y-2">
                        {/* @ts-expect-error */}
                        <gmpx-place-picker
                            ref={pickerRef}
                            placeholder="場所を検索..."
                            class="w-full"
                        />
                        <input
                            type="text"
                            placeholder="名称（自動入力されます）"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className={`w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 ${errors.title
                                ? "border-red-500 focus:ring-red-500"
                                : "border-gray-300 focus:ring-blue-500"
                                }`}
                        />
                    </div>
                    {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
                </div>

                <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        住所 <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            placeholder="例：東京都渋谷区〇〇、New York, USA など"
                            value={address}
                            onChange={(e) => {
                                setAddress(e.target.value);
                                const detected = autoDetectInternationalTypeAndRegion(e.target.value);
                                setInternationalType(detected.internationalType);
                                setRegion(detected.region);
                                // setAutoDetected(true); // 完全削除
                            }}
                            className={`w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 ${errors.address
                                ? "border-red-500 focus:ring-red-500"
                                : "border-gray-300 focus:ring-blue-500"
                                }`}
                        />
                        {/* 一時非表示 */}
                        {/*
                        <button
                            type="button"
                            className="rounded bg-blue-500 text-white px-3 py-2 text-sm font-semibold hover:bg-blue-600 disabled:opacity-50"
                            disabled={isGeminiLoading || !address.trim()}
                            onClick={async () => {
                                setIsGeminiLoading(true);
                                setGeminiError(null);
                                try {
                                    // APIキーは安全な方法で取得してください
                                    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_AI_KEY || "";
                                    if (!apiKey) throw new Error("Gemini APIキーが設定されていません");
                                    const result = await fetchGeminiLocationResult(address, apiKey);
                                    setInternationalType(result.internationalType);
                                    setRegion(result.region);
                                } catch (err: unknown) {
                                    setGeminiError(err instanceof Error ? err.message : "Gemini APIエラー");
                                } finally {
                                    setIsGeminiLoading(false);
                                }
                            }}
                        >
                            {isGeminiLoading ? "判別中..." : "地域を反映する"}
                        </button>
                        */}
                    </div>
                    {geminiError && <p className="mt-1 text-sm text-red-600">{geminiError}</p>}
                    {errors.address && <p className="mt-1 text-sm text-red-600">{errors.address}</p>}
                </div>

                <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        国際区分 <span className="text-red-500">*</span>
                    </label>
                    <select
                        value={internationalType}
                        onChange={e => {
                            const type = e.target.value;
                            setInternationalType(type);
                            // 国際区分変更時、regionも自動で切り替え
                            if (type === "日本") {
                                setRegion(PREFECTURES[DEFAULT_PREFECTURE_INDEX]);
                            } else {
                                setRegion(COUNTRIES[0]);
                            }
                        }}
                        className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        {INTERNATIONAL_TYPES.map(type => (
                            <option key={type} value={type}>{type}</option>
                        ))}
                    </select>
                </div>

                <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        {internationalType === "日本" ? "都道府県" : "国名"} <span className="text-red-500">*</span>
                    </label>
                    {internationalType === "日本" ? (
                        <select
                            value={region}
                            onChange={e => setRegion(e.target.value)}
                            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            {PREFECTURES.map(pref => (
                                <option key={pref} value={pref}>{pref}</option>
                            ))}
                        </select>
                    ) : (
                        <select
                            value={region}
                            onChange={e => setRegion(e.target.value)}
                            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            {COUNTRIES.map(country => (
                                <option key={country} value={country}>{country}</option>
                            ))}
                        </select>
                    )}
                    {errors.region && <p className="mt-1 text-sm text-red-600">{errors.region}</p>}
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

                {/* 都道府県欄はregionで一元化したため削除 */}

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

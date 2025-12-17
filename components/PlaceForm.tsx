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
                    <input
                        type="text"
                        placeholder="例：〇〇カフェ"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className={`w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 ${errors.title
                                ? "border-red-500 focus:ring-red-500"
                                : "border-gray-300 focus:ring-blue-500"
                            }`}
                    />
                    {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
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

                <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        行動 <span className="text-red-500">*</span>
                    </label>
                    {/* <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        {STATUSES.map((s: string) => (
                            <option key={s} value={s}>{s}</option>
                        ))}
                    </select> */}
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

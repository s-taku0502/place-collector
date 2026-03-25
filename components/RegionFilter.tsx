"use client";

import React from "react";

export type RegionClass = "A";

export function getRegionGroups() {
    const A: Record<string, string[]> = {
        "北海道": ["北海道"],
        "東北": ["青森県", "岩手県", "秋田県", "宮城県", "山形県", "福島県", "新潟県"],
        "関東": ["茨城県", "栃木県", "群馬県", "山梨県", "長野県", "埼玉県", "千葉県", "東京都", "神奈川県"],
        "東海": ["静岡県", "岐阜県", "愛知県", "三重県"],
        "北陸": ["富山県", "石川県", "福井県"],
        "近畿": ["滋賀県", "京都府", "奈良県", "和歌山県", "大阪府", "兵庫県"],
        "中国": ["鳥取県", "島根県", "岡山県", "広島県", "山口県"],
        "四国": ["徳島県", "香川県", "愛媛県", "高知県"],
        "九州": ["福岡県", "佐賀県", "長崎県", "大分県", "熊本県", "宮崎県", "鹿児島県"],
        "沖縄": ["沖縄県"],
    };
    return { A } as const;
}

type Props = {
    regionClass: RegionClass;
    setRegionClass: (c: RegionClass) => void;
    selectedPrefectures: string[];
    setSelectedPrefectures: (s: string[]) => void;
};

export default function RegionFilter({ regionClass, setRegionClass, selectedPrefectures, setSelectedPrefectures }: Props) {
    const groups = getRegionGroups();
    const prefsForClass = groups[regionClass];

    return (
        <div>
            <div className="space-y-3 max-h-56 overflow-y-auto border rounded p-2">
                {Object.entries(groups[regionClass]).map(([regionName, prefs]) => (
                    <div key={regionName} className="mb-2">
                        <div className="text-sm font-semibold text-gray-800 mb-1">{regionName}</div>
                        <div className="flex flex-wrap gap-2">
                            {prefs.map(pref => (
                                <label key={pref} className="inline-flex items-center text-sm">
                                    <input
                                        type="checkbox"
                                        checked={selectedPrefectures.includes(pref)}
                                        onChange={(e) => {
                                            if (e.target.checked) setSelectedPrefectures([...selectedPrefectures, pref]);
                                            else setSelectedPrefectures(selectedPrefectures.filter(p => p !== pref));
                                        }}
                                        className="mr-1"
                                    />
                                    <span className="text-sm text-gray-700">{pref.replace(/県|府/, '')}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

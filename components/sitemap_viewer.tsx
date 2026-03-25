"use client"
import React, { useEffect, useState } from "react";

type Entry = {
    loc: string;
    lastmod?: string;
    changefreq?: string;
    priority?: string;
};

export default function SitemapViewer() {
    const [entries, setEntries] = useState<Entry[] | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    async function load() {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/sitemap.xml');
            if (!res.ok) throw new Error(`fetch failed: ${res.status}`);
            const text = await res.text();
            const parser = new DOMParser();
            const xml = parser.parseFromString(text, 'application/xml');
            const urlNodes = Array.from(xml.getElementsByTagName('url'));
            const parsed: Entry[] = urlNodes.map((u) => ({
                loc: u.getElementsByTagName('loc')[0]?.textContent?.trim() || '',
                lastmod: u.getElementsByTagName('lastmod')[0]?.textContent?.trim() || undefined,
                changefreq: u.getElementsByTagName('changefreq')[0]?.textContent?.trim() || undefined,
                priority: u.getElementsByTagName('priority')[0]?.textContent?.trim() || undefined,
            }));

            setEntries(parsed);
        } catch (e: any) {
            setError(e?.message ?? String(e));
            setEntries([]);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        load();
    }, []);

    if (error) return <div className="text-red-600">読み込みエラー: {error}</div>;
    if (loading && !entries) return <div>読み込み中…</div>;

    const origin = typeof window !== 'undefined' ? window.location.origin.replace(/\/$/, '') : '';

    return (
        <div className="prose max-w-none">
            <div className="mb-4 flex items-center justify-between">
                <div>
                    <strong>URL数:</strong> {entries?.length ?? 0}
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => load()}
                        className="text-sm text-gray-600 hover:underline"
                        aria-label="更新"
                    >
                        更新
                    </button>
                    <a href="/sitemap.xml" className="text-sm text-blue-600 hover:underline">生の sitemap.xml を表示</a>
                </div>
            </div>

            <ul>
                {(entries || []).map((e, i) => {
                    const isInternal = origin && e.loc.startsWith(origin);
                    const display = isInternal ? e.loc.replace(origin, '') || '/' : e.loc;
                    return (
                        <li key={i} className="mb-3">
                            <a href={e.loc} className="text-blue-600 hover:underline break-words">
                                {display}
                            </a>
                            {e.lastmod && <div className="text-sm text-gray-500">更新日: {e.lastmod}</div>}
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}
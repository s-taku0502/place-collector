"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import Link from "next/link";
import { useRouter } from "next/navigation";

const WANT_STATUS = "まだ行ってない";

export default function WantListPage() {
    const places = useQuery(api.places.listByStatus, { status: WANT_STATUS });
    const router = useRouter();

    const markDone = async (placeId: Id<"places">) => {
        router.push(`/place/detail/feedback?id=${placeId}`);
    };

    return (
        <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
            <div className="mx-auto max-w-6xl px-4">
                <div className="mb-6 flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-gray-900">行きたいリスト</h1>
                    <Link
                        href="/place/new"
                        className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:shadow-lg"
                    >
                        追加する
                    </Link>
                </div>

                {!places?.length && (
                    <div className="rounded-xl border border-dashed border-gray-300 bg-white p-6 text-center text-gray-600">
                        まだ行きたい場所がありません。追加してみましょう。
                    </div>
                )}

                <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                    {places?.map(p => (
                        <div key={p._id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                            <Link href={`/place/detail?id=${p._id}`} className="block hover:opacity-90">
                                <h3 className="text-lg font-semibold text-gray-900">{p.title}</h3>
                                <p className="mt-1 text-sm text-gray-600">{p.address ?? "住所未設定"}</p>
                                <p className="mt-1 text-xs text-gray-500">{p.genre ?? "ジャンル未設定"}</p>
                            </Link>
                            <div className="mt-4 flex gap-2">
                                <button
                                    className="flex-1 rounded-lg bg-gradient-to-r from-green-500 to-green-600 px-3 py-2 text-sm font-semibold text-white shadow-md transition hover:shadow-lg hover:scale-105 active:scale-95"
                                    onClick={() => void markDone(p._id)}
                                >
                                    行った！
                                </button>
                                <Link
                                    href={`/place/detail?id=${p._id}`}
                                    className="rounded-lg border-2 border-gray-200 px-3 py-2 text-center text-sm font-semibold text-gray-700 shadow-sm transition hover:border-gray-400 hover:bg-gray-100 active:scale-95"
                                >
                                    詳細
                                </Link>
                                <Link
                                    href={`/${p._id}/edit`}
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

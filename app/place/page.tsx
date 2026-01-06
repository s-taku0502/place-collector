"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function WantListPage() {
    const places = useQuery(api.places.list, {});
    const router = useRouter();
    const deletePlace = useMutation(api.places.remove);

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
                <div className="mb-6 flex items-center justify-end">
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

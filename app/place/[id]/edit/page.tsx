"use client";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useEffect, useState } from "react";

export default function EditPage() {
    const params = useParams();
    const router = useRouter();
    const idParam = (params?.id as string | undefined) ?? undefined;
    const id = idParam as Id<"places"> | undefined;

    // useQuery をスキップする場合は undefined を渡す
    const place = useQuery(api.places.get, id ? { id } : undefined);
    const updatePartial = useMutation(api.places.updatePartial);

    const [title, setTitle] = useState("");
    const [instagramUrl, setInstagramUrl] = useState("");
    const [memo, setMemo] = useState<string>("");

    useEffect(() => {
        if (place) {
            setTitle(place.title ?? "");
            setInstagramUrl(place.instagramUrl ?? "");
            setMemo(place.memo ?? "");
        }
    }, [place]);

    if (!id) return <main className="p-6">IDが不正です</main>;
    if (place === undefined) return <main className="p-6">読み込み中…</main>;
    if (place === null) return <main className="p-6">項目が見つかりません</main>;

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        await updatePartial({ id: place._id, title, beforeUrl: instagramUrl, beforeMemo: memo || undefined, instagramUrl });
        router.push("/");
    }

    return (
        <main className="mx-auto max-w-xl p-6">
            <h1 className="text-2xl font-bold">編集</h1>
            <form onSubmit={onSubmit} className="mt-4 space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">タイトル</label>
                    <input
                        className="mt-1 w-full rounded-md border border-gray-300 p-2"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        type="text"
                        placeholder="タイトル"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Instagram URL</label>
                    <input
                        className="mt-1 w-full rounded-md border border-gray-300 p-2"
                        value={instagramUrl}
                        onChange={(e) => setInstagramUrl(e.target.value)}
                        type="url"
                        placeholder="https://instagram.com/"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">メモ</label>
                    <textarea
                        className="mt-1 w-full rounded-md border border-gray-300 p-2"
                        value={memo}
                        onChange={(e) => setMemo(e.target.value)}
                    />
                </div>
                <div className="flex gap-2">
                    <button
                        type="submit"
                        className="rounded-md bg-gray-900 px-4 py-2 text-white hover:bg-gray-800"
                    >
                        保存
                    </button>
                    <button
                        type="button"
                        className="rounded-md border border-gray-300 px-4 py-2 hover:bg-gray-50"
                        onClick={() => router.back()}
                    >
                        キャンセル
                    </button>
                </div>
            </form>
        </main>
    );
}

"use client";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

export default function EditPage() {
    const params = useParams();
    const router = useRouter();
    const idParam = (params?.id as string | undefined) ?? undefined;
    const id = idParam as Id<"places"> | undefined;

    // useQuery をスキップする場合は undefined を渡す
    const place = useQuery(api.places.get, id ? { id } : "skip");
    const updatePartial = useMutation(api.places.updatePartial);

    if (!id) return <main className="p-6">IDが不正です</main>;
    if (place === undefined) return <main className="p-6">読み込み中…</main>;
    if (place === null) return <main className="p-6">項目が見つかりません</main>;

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!place) return;
        const formData = new FormData(e.currentTarget as HTMLFormElement);
        const title = (formData.get("title") as string | null)?.trim() ?? "";
        const instagramUrl = (formData.get("instagramUrl") as string | null)?.trim() ?? "";
        const memo = (formData.get("memo") as string | null)?.trim() ?? "";
        const visitedDate = (formData.get("visitedDate") as string | null) || undefined;

        await updatePartial({
            id: place._id,
            title,
            instagramUrl,
            memo: memo || undefined,
            visitedDate: visitedDate || undefined,
        });
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
                        name="title"
                        defaultValue={place.title ?? ""}
                        type="text"
                        placeholder="タイトル"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">行った日付</label>
                    <input
                        className="mt-1 w-full rounded-md border border-gray-300 p-2"
                        name="visitedDate"
                        type="date"
                        defaultValue={place.visitedDate ? place.visitedDate.slice(0, 10) : ""}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Instagram URL</label>
                    <input
                        className="mt-1 w-full rounded-md border border-gray-300 p-2"
                        name="instagramUrl"
                        defaultValue={place.instagramUrl ?? ""}
                        type="url"
                        placeholder="https://instagram.com/"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">メモ</label>
                    <textarea
                        className="mt-1 w-full rounded-md border border-gray-300 p-2"
                        name="memo"
                        defaultValue={place.memo ?? ""}
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

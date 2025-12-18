"use client";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import PlaceForm, { PlaceFormValues } from "../../../../components/PlaceForm";

export default function EditPage() {
    const params = useParams();
    const router = useRouter();
    const idParam = (params?.id as string | undefined) ?? undefined;
    const id = idParam as Id<"places"> | undefined;

    const place = useQuery(api.places.get, id ? { id } : "skip");
    const updatePartial = useMutation(api.places.updatePartial);

    if (!id) return <main className="p-6">IDが不正です</main>;
    if (place === undefined) return <main className="p-6">読み込み中…</main>;
    if (place === null) return <main className="p-6">項目が見つかりません</main>;

    const handleSubmit = async (values: PlaceFormValues) => {
        await updatePartial({
            id: place._id,
            title: values.title || undefined,
            address: values.address || undefined,
            station: values.station || undefined,
            genre: values.genre || undefined,
            prefecture: values.prefecture || undefined,
            seasons: values.seasons || undefined,
            mood: values.mood || undefined,
            // status: values.status || undefined,
            beforeMemo: values.beforeMemo || undefined,
            beforeUrl: values.beforeUrl || undefined,
        });
        router.push("/");
    };

    return (
        <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
            <div className="mx-auto max-w-2xl px-4">
                <PlaceForm
                    initialValues={{
                        title: place.title ?? "",
                        address: place.address ?? "",
                        station: place.station ?? "",
                        genre: place.genre ?? undefined,
                        prefecture: place.prefecture ?? undefined,
                        seasons: place.seasons ?? [],
                        mood: place.mood ?? undefined,
                        // status: place.status ?? undefined,
                        beforeMemo: place.beforeMemo ?? (place as unknown as { memo?: string }).memo ?? "",
                        beforeUrl: place.beforeUrl ?? (place as unknown as { instagramUrl?: string }).instagramUrl ?? "",
                    }}
                    onSubmit={handleSubmit}
                    submitLabel="保存"
                    onCancel={() => router.back()}
                />
            </div>
        </main>
    );
}

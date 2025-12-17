"use client";
import { useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import { api } from "../../../convex/_generated/api";
import PlaceForm, { getDefaultPlaceFormValues, PlaceFormValues } from "../../../components/PlaceForm";

export default function NewPlace() {
    const router = useRouter();
    const add = useMutation(api.places.add);

    const handleSubmit = async (values: PlaceFormValues) => {
        try {
            await add(values);
            router.push("/");
        } catch (err) {
            alert("追加に失敗しました");
            console.error(err);
        }
    };

    return (
        <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
            <div className="mx-auto max-w-2xl px-4">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">新しい場所を追加</h1>
                <PlaceForm
                    initialValues={getDefaultPlaceFormValues()}
                    onSubmit={handleSubmit}
                    submitLabel="追加"
                    onCancel={() => router.back()}
                />
            </div>
        </main>
    );
}

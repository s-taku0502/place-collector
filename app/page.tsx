"use client";
import { useQuery, useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import Link from "next/link";

export default function Home() {
  const router = useRouter();
  const places = useQuery(api.places.list, {});
  const toggleVisited = useMutation(api.places.toggleStatus); // 行った・行ってないを切り替える


  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
      <div className="mx-auto max-w-6xl px-4">
        {/* 追加ボタン */}
        <button
          onClick={() =>
            router.push("/place/new")
          }
          className="mb-8 inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-3 font-semibold text-white shadow-lg transition-all hover:shadow-xl hover:scale-105 active:scale-95"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          新しい場所を追加
        </button>

        {/* カード一覧 */}
        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {places?.map(p => (
          <div
            key={p._id}
            className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
          >
            <h3 className="text-lg font-semibold text-gray-900">{p.title}</h3>
            <p className="mt-1 text-sm text-gray-600">
              <a
                href={p.beforeUrl || "#"}
                className="text-blue-600 underline decoration-blue-300 hover:text-blue-700"
              >
                Instagram
              </a>
            </p>
            <div className="mt-4 flex gap-2">
              <button
                className="flex-1 rounded-lg bg-gradient-to-r from-green-500 to-green-600 px-4 py-2 text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg hover:scale-105 active:scale-95"
                onClick={() =>
                  toggleVisited({
                    id: p._id,
                    status:
                      p.status === "まだ行ってない"
                        ? "行った（また行きたい）"
                        : "まだ行ってない",
                  })
                }
              >
                {p.status === "まだ行ってない" ? "行きたい" : "✓ 行った"}
              </button>
              <Link
                href={`/place/${p._id}/edit`}
                className="rounded-lg border-2 border-gray-200 px-4 py-2 text-center text-sm font-semibold text-gray-700 shadow-sm transition-all hover:border-gray-400 hover:bg-gray-100 active:scale-95"
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

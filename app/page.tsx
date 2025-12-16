"use client";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";

export default function Home() {
  const places = useQuery(api.places.list, {});
  const add = useMutation(api.places.add);
  const toggleVisited = useMutation(api.places.toggleVisited); // 行った・行ってないを切り替える


  return (
    <main>
      <button
        onClick={() =>
          add({
            instagramUrl: "https://instagram.com/",
            title: "カフェ",
          })
        }
      >
        追加
      </button>

      {/* ボタン（行動フラグ）の追加 */}
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        {places?.map(p => (
          <div
            key={p._id}
            className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
          >
            <h3 className="text-lg font-semibold text-gray-900">{p.title}</h3>
            <p className="mt-1 text-sm text-gray-600">
              <a
                href={p.instagramUrl}
                className="text-blue-600 underline decoration-blue-300 hover:text-blue-700"
              >
                Instagram
              </a>
            </p>
            <div className="mt-3">
              <button
                className="w-full rounded-lg bg-gray-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-gray-800"
                onClick={() => toggleVisited({ id: p._id })}
              >
                {p.visited ? "行った" : "行きたい"}
              </button>
              <div className="mt-2">
                <Link
                  href={`/${p._id}/edit`}
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-center text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  編集
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}

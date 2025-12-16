"use client";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

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
      {places?.map(p => (
        <div key={p._id}>
          <h3>{p.title}</h3>
          <p><a href={p.instagramUrl}>Instagram</a></p>
          <button onClick={() => toggleVisited({ id: p._id })}>
            {p.visited ? "行った" : "行きたい"}
          </button>
        </div>
      ))}
    </main>
  );
}

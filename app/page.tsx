"use client";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

export default function Home() {
  const places = useQuery(api.places.list, {});
  const add = useMutation(api.places.add);

  return (
    <main>
      <button
        onClick={() =>
          add({
            instagramUrl: "https://instagram.com/...",
            title: "カフェ",
          })
        }
      >
        追加
      </button>

      {places?.map(p => (
        <div key={p._id}>
          <h3>{p.title}</h3>
          <a href={p.instagramUrl}>Instagram</a>
        </div>
      ))}
    </main>
  );
}

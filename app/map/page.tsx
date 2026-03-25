"use client";

import dynamic from "next/dynamic";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

// MapView をクライアントサイドでのみ読み込むように設定 (SSRを無効化)
const MapView = dynamic(() => import("./MapView"), { 
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
        <p className="text-sm font-medium text-gray-500">地図を読み込んでいます...</p>
      </div>
    </div>
  )
});

export default function MapAllPage() {
  const places = useQuery(api.places.list, {});
  
  // プレースホルダーの表示（places が undefined の間）
  if (places === undefined) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
          <p className="text-sm font-medium text-gray-500">データを取得中...</p>
        </div>
      </div>
    );
  }

  return <MapView title="すべての場所" places={places ?? []} />;
}

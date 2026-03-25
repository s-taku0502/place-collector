"use client";

import { useEffect, useRef, useMemo, useState } from "react";
import RegionFilter from "@/components/RegionFilter";

type VisitFilter = "all" | "visited" | "unvisited";

export default function MapView({ title, places }: { title: string; places: any[] }) {
  const mapReady = useRef(false);
  const markersRef = useRef<any[]>([]);
  const [selectedRegionClass, setSelectedRegionClass] = useState<"A"|"B"|"C">("A");
  const [selectedPrefectures, setSelectedPrefectures] = useState<string[]>([]);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState<string>("all");
  const [visitFilter, setVisitFilter] = useState<VisitFilter>("all");
  const [hoveredPlaceId, setHoveredPlaceId] = useState<string | null>(null);

  // 1. ジャンル一覧の抽出
  const genres = useMemo(() => {
    const g = new Set<string>();
    places.forEach(p => { if (p.genre) g.add(p.genre); });
    return Array.from(g);
  }, [places]);

  // 2. フィルタリングロジック
  const filteredPlaces = useMemo(() => {
    if (!places) return [];
    return places.filter((p: any) => {
      const matchVisit = 
        visitFilter === "all" || 
        (visitFilter === "visited" && p.visited) || 
        (visitFilter === "unvisited" && !p.visited);
      const matchPref = selectedPrefectures.length === 0 || (p.prefecture && selectedPrefectures.includes(p.prefecture));
      const matchGenre = selectedGenre === "all" || p.genre === selectedGenre;
      const matchSearch = searchQuery === "" || 
        p.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
        p.address?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchVisit && matchPref && matchGenre && matchSearch;
    });
  }, [places, visitFilter, selectedPrefectures, selectedGenre, searchQuery]);

  // 3. 地図初期化
  useEffect(() => {
    let retry: NodeJS.Timeout;
    async function init() {
      // @ts-ignore
      if (typeof customElements !== 'undefined') {
        await customElements.whenDefined("gmp-map");
        mapReady.current = true;
        setTimeout(() => updateMarkers(), 500);
      }
    }
    function tryInit() {
      if (typeof window !== "undefined" && window.google && window.google.maps) init();
      else retry = setTimeout(tryInit, 500);
    }
    tryInit();
    return () => retry && clearTimeout(retry);
  }, []);

  const updateMarkers = async () => {
    if (!mapReady.current) return;
    const mapEl = document.querySelector("gmp-map") as any;
    if (!mapEl || !window.google?.maps) return;

    markersRef.current.forEach(m => m && m.setMap && m.setMap(null));
    markersRef.current = [];

    const geocoder = new window.google.maps.Geocoder();
    const colorForGenre = (p: any) => {
      if (!p.genre) return p.visited ? "green" : "red";
      const key = p.genre.toLowerCase();
      if (key.includes("food") || key.includes("飲食") || key.includes("グルメ")) return "orange";
      if (key.includes("cafe") || key.includes("カフェ")) return "purple";
      if (key.includes("park") || key.includes("公園")) return "green";
      if (key.includes("shop") || key.includes("ショップ")) return "blue";
      if (key.includes("museum") || key.includes("美術館") || key.includes("博物")) return "yellow";
      return p.visited ? "green" : "red";
    };

    for (const p of filteredPlaces) {
      let loc = p.location ? { lat: Number(p.location.lat), lng: Number(p.location.lng) } : null;
      if (!loc && p.address) {
        try {
          const res = await new Promise<any>((resolve, reject) =>
            geocoder.geocode({ address: p.address }, (results: any, status: any) => {
              if (status === "OK" && results?.[0]) resolve(results[0]);
              else reject(status);
            })
          );
          loc = { lat: res.geometry.location.lat(), lng: res.geometry.location.lng() };
        } catch (e) { continue; }
      }

      const targetMap = mapEl.innerMap || mapEl;
      if (loc && targetMap) {
        const color = colorForGenre(p);
        const marker = new window.google.maps.Marker({
          position: loc,
          map: targetMap,
          title: p.title,
          icon: { url: `https://maps.google.com/mapfiles/ms/icons/${color}-dot.png` }
        });
        const infow = new window.google.maps.InfoWindow({
          content: `<div style="padding:8px;color:#333"><strong>${p.title}</strong><br><span style="font-size:12px;color:#666">${p.address || ""}</span><br><span style="font-size:11px;font-weight:bold;color:${p.visited ? '#16a34a' : '#f97316'}">${p.visited ? '● 訪問済み' : '○ 未訪問'}</span></div>`
        });
        marker.addListener("click", () => infow.open(targetMap, marker));
        markersRef.current.push(marker);
      }
    }
  };

  useEffect(() => {
    const timer = setTimeout(updateMarkers, 300);
    return () => clearTimeout(timer);
  }, [filteredPlaces]);

  const handlePlaceClick = async (p: any) => {
    if (!p.address) return;
    const mapEl = document.querySelector("gmp-map") as any;
    const markerEl = document.querySelector("#map-selected-marker") as any;
    try {
      const geocoder = new window.google.maps.Geocoder();
      const res = await new Promise<any>((resolve, reject) =>
        geocoder.geocode({ address: p.address }, (results: any, status: any) => {
          if (status === "OK" && results?.[0]) resolve(results[0]);
          else reject(status);
        })
      );
      const loc = res.geometry.location;
      const targetMap = mapEl.innerMap || mapEl;
      if (targetMap && typeof targetMap.setCenter === 'function') {
        targetMap.setCenter(loc);
        targetMap.setZoom(16);
      }
      if (markerEl) markerEl.position = { lat: loc.lat(), lng: loc.lng() };
    } catch (e) {}
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-gray-50 overflow-hidden font-sans">
      {/* 1. メインヘッダー（訪問ステータスボタン） */}
      <div className="bg-white px-6 py-4 flex items-center gap-4 z-20 shadow-sm border-b">
        <button 
          onClick={() => setVisitFilter("all")}
          className={`px-6 py-2.5 rounded-lg font-bold transition-all shadow-md ${visitFilter === "all" ? 'bg-blue-600 text-white scale-105' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}
        >
          すべて
        </button>
        <button 
          onClick={() => setVisitFilter("visited")}
          className={`px-6 py-2.5 rounded-lg font-bold transition-all shadow-md ${visitFilter === "visited" ? 'bg-green-600 text-white scale-105' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}
        >
          行った場所
        </button>
        <button 
          onClick={() => setVisitFilter("unvisited")}
          className={`px-6 py-2.5 rounded-lg font-bold transition-all shadow-md ${visitFilter === "unvisited" ? 'bg-gray-400 text-white scale-105' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
        >
          まだ行ってない
        </button>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* 2. 地図セクション */}
        <div className="flex-1 relative order-2 lg:order-1">
          <gmp-map
            style={{ width: "100%", height: "100%" }}
            center="35.681236,139.767125"
            zoom="13"
            map-id={process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || ""}
          >
            <gmp-advanced-marker id="map-selected-marker" position="35.681236,139.767125"></gmp-advanced-marker>
          </gmp-map>
          
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 w-full max-w-sm px-4">
            <gmpx-place-picker style={{ width: "100%", borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}></gmpx-place-picker>
          </div>
        </div>

        {/* 3. サイドバー（リスト & 検索） */}
        <aside className="w-full lg:w-[400px] bg-white border-r flex flex-col shadow-xl z-10 order-1 lg:order-2">
          {/* 検索 & フィルター */}
          <div className="p-4 space-y-3 bg-white border-b">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="場所名や住所で検索..."
                  className="w-full pl-9 pr-4 py-2.5 bg-gray-100 border-none rounded-xl focus:ring-2 focus:ring-blue-500 text-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <svg className="absolute left-3 top-3 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <button 
                onClick={() => setShowFilterPanel(true)}
                className="p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition shadow-sm text-gray-600"
                title="地域フィルター"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L14 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 018 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
                </svg>
              </button>
            </div>

            <select 
              className="w-full bg-gray-50 border-none rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-medium text-gray-700 appearance-none"
              value={selectedGenre}
              onChange={(e) => setSelectedGenre(e.target.value)}
              style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%236b7280\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'%3E%3C/path%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1.25rem' }}
            >
              <option value="all">すべてのジャンル</option>
              {genres.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>

          {/* リスト表示 */}
          <div className="flex-1 overflow-y-auto custom-scrollbar bg-gray-50/30">
            <div className="px-4 py-3 flex justify-between items-center">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                {visitFilter === "all" ? "すべての場所" : visitFilter === "visited" ? "行った場所" : "まだ行ってない場所"}
              </span>
              <span className="text-xs font-medium text-gray-500 bg-white px-2 py-1 rounded-md border shadow-sm">
                {filteredPlaces.length}件
              </span>
            </div>

            {filteredPlaces.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400 px-8 text-center">
                <p className="text-sm">該当する場所が見つかりません</p>
                <button onClick={() => {setSearchQuery(""); setSelectedGenre("all"); setSelectedPrefectures([]); setVisitFilter("all");}} className="mt-4 text-blue-500 text-sm font-bold hover:underline">リセット</button>
              </div>
            ) : (
              <div className="space-y-3 p-4 pt-0">
                {filteredPlaces.map((p: any) => (
                  <div 
                    key={p._id}
                    onMouseEnter={() => setHoveredPlaceId(p._id)}
                    onMouseLeave={() => setHoveredPlaceId(null)}
                    onClick={() => handlePlaceClick(p)}
                    className={`p-4 bg-white rounded-2xl shadow-sm border transition-all duration-200 cursor-pointer ${hoveredPlaceId === p._id ? 'ring-2 ring-blue-500 shadow-md transform -translate-y-0.5' : 'border-gray-100 hover:border-blue-200 hover:shadow-md'}`}
                  >
                    <div className="flex justify-between items-start gap-2 mb-1.5">
                      <h3 className="font-bold text-gray-900 leading-snug">{p.title}</h3>
                      {p.genre && (
                        <span className="shrink-0 text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-bold">
                          {p.genre}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 line-clamp-2 mb-3 leading-relaxed">{p.address || "住所なし"}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${p.visited ? 'bg-green-500' : 'bg-orange-500'}`}></span>
                        <span className={`text-[10px] font-bold ${p.visited ? 'text-green-600' : 'text-orange-500'}`}>
                          {p.visited ? '訪問済み' : '未訪問'}
                        </span>
                      </div>
                      {p.prefecture && (
                        <span className="text-[10px] text-gray-400 font-medium">📍 {p.prefecture}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* フィルタードロワー */}
      {showFilterPanel && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={() => setShowFilterPanel(false)} />
          <aside className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-slide-in-right">
            <div className="p-6 border-b flex items-center justify-between bg-white">
              <h2 className="text-xl font-bold text-gray-900">地域フィルター</h2>
              <button onClick={() => setShowFilterPanel(false)} className="p-2 hover:bg-gray-100 rounded-full transition">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <RegionFilter regionClass={selectedRegionClass} setRegionClass={setSelectedRegionClass} selectedPrefectures={selectedPrefectures} setSelectedPrefectures={setSelectedPrefectures} />
            </div>
            <div className="p-6 border-t bg-gray-50">
              <button onClick={() => setShowFilterPanel(false)} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition shadow-lg">適用する</button>
            </div>
          </aside>
        </div>
      )}

      <style jsx global>{`
        @keyframes slide-in-right { from { transform: translateX(100%); } to { transform: translateX(0); } }
        .animate-slide-in-right { animation: slide-in-right 0.3s ease-out; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #d1d5db; }
      `}</style>
    </div>
  );
}

"use client";

import { useEffect, useRef, useMemo, useState } from "react";
import RegionFilter from "@/components/RegionFilter";

export default function MapView({ title, places }: { title: string; places: any[] }) {
  const mapReady = useRef(false);
  const markersRef = useRef<any[]>([]);
  const [selectedRegionClass, setSelectedRegionClass] = useState<"A"|"B"|"C">("A");
  const [selectedPrefectures, setSelectedPrefectures] = useState<string[]>([]);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState<string>("all");
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
      const matchPref = selectedPrefectures.length === 0 || (p.prefecture && selectedPrefectures.includes(p.prefecture));
      const matchGenre = selectedGenre === "all" || p.genre === selectedGenre;
      const matchSearch = searchQuery === "" || 
        p.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
        p.address?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchPref && matchGenre && matchSearch;
    });
  }, [places, selectedPrefectures, selectedGenre, searchQuery]);

  // 3. 地図初期化とマーカー管理
  useEffect(() => {
    let retry: NodeJS.Timeout;
    async function init() {
      await customElements.whenDefined("gmp-map");
      mapReady.current = true;
    }
    
    function tryInit() {
      if (typeof window !== "undefined" && window.google && window.google.maps) {
        init();
      } else {
        retry = setTimeout(tryInit, 500);
      }
    }
    tryInit();
    return () => retry && clearTimeout(retry);
  }, []);

  useEffect(() => {
    if (!mapReady.current) return;
    const mapEl = document.querySelector("gmp-map") as any;
    if (!mapEl || !window.google?.maps) return;

    const updateMarkers = async () => {
      // 古いマーカーを削除
      markersRef.current.forEach(m => m && m.setMap && m.setMap(null));
      markersRef.current = [];

      const geocoder = new window.google.maps.Geocoder();
      
      const colorForGenre = (genre?: string) => {
        if (!genre) return "red";
        const key = genre.toLowerCase();
        if (key.includes("food") || key.includes("飲食") || key.includes("グルメ")) return "orange";
        if (key.includes("cafe") || key.includes("カフェ")) return "purple";
        if (key.includes("park") || key.includes("公園")) return "green";
        if (key.includes("shop") || key.includes("ショップ")) return "blue";
        if (key.includes("museum") || key.includes("美術館") || key.includes("博物")) return "yellow";
        return "red";
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

        if (loc && mapEl.innerMap) {
          const color = colorForGenre(p.genre);
          const marker = new window.google.maps.Marker({
            position: loc,
            map: mapEl.innerMap,
            title: p.title,
            icon: { url: `https://maps.google.com/mapfiles/ms/icons/${color}-dot.png` }
          });

          const infow = new window.google.maps.InfoWindow({
            content: `<div style="padding:8px"><strong>${p.title}</strong><br><span style="font-size:12px;color:#666">${p.address || ""}</span></div>`
          });

          marker.addListener("click", () => infow.open(mapEl.innerMap, marker));
          markersRef.current.push(marker);
        }
      }
    };

    const timer = setTimeout(updateMarkers, 300);
    return () => clearTimeout(timer);
  }, [filteredPlaces]);

  const handlePlaceClick = async (p: any) => {
    if (!p.address) return alert("住所が設定されていません");
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
      if (mapEl.innerMap) {
        mapEl.innerMap.setCenter(loc);
        mapEl.innerMap.setZoom(16);
      }
      if (markerEl) markerEl.position = { lat: loc.lat(), lng: loc.lng() };
    } catch (e) {
      alert("位置を特定できませんでした");
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-gray-50 overflow-hidden">
      {/* ヘッダーセクション */}
      <div className="bg-white border-b px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm z-10">
        <div>
          <h1 className="text-xl font-bold text-gray-800">{title}</h1>
          <p className="text-sm text-gray-500">{filteredPlaces.length} 件のスポットが見つかりました</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative flex-1 md:w-64">
            <input
              type="text"
              placeholder="場所名や住所で検索..."
              className="w-full pl-10 pr-4 py-2 bg-gray-100 border-none rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <svg className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <button 
            onClick={() => setShowFilterPanel(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition text-sm font-medium shadow-sm"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L14 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 018 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
            </svg>
            フィルター
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* 地図セクション */}
        <div className="flex-1 relative">
          <gmp-map
            style={{ width: "100%", height: "100%" }}
            center="35.681236,139.767125"
            zoom="13"
            map-id={process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || ""}
          >
            <gmp-advanced-marker id="map-selected-marker" position="35.681236,139.767125"></gmp-advanced-marker>
          </gmp-map>
          
          {/* マップ上のフローティング検索バー */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 w-full max-w-sm px-4">
            <gmpx-place-picker style={{ width: "100%", borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}></gmpx-place-picker>
          </div>
        </div>

        {/* サイドバーセクション */}
        <aside className="w-full lg:w-96 bg-white border-l flex flex-col shadow-inner">
          <div className="p-4 border-b bg-gray-50/50">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">ジャンルで絞り込む</label>
            <select 
              className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              value={selectedGenre}
              onChange={(e) => setSelectedGenre(e.target.value)}
            >
              <option value="all">すべてのジャンル</option>
              {genres.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {filteredPlaces.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-400 px-8 text-center">
                <svg className="h-12 w-12 mb-4 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <p>該当する場所が見つかりません</p>
                <button onClick={() => {setSearchQuery(""); setSelectedGenre("all"); setSelectedPrefectures([]);}} className="mt-4 text-blue-500 text-sm hover:underline">フィルターをリセット</button>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredPlaces.map((p: any) => (
                  <div 
                    key={p._id}
                    onMouseEnter={() => setHoveredPlaceId(p._id)}
                    onMouseLeave={() => setHoveredPlaceId(null)}
                    onClick={() => handlePlaceClick(p)}
                    className={`p-4 cursor-pointer transition-all duration-200 hover:bg-blue-50/50 ${hoveredPlaceId === p._id ? 'bg-blue-50 border-l-4 border-blue-500' : 'border-l-4 border-transparent'}`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="font-bold text-gray-900 leading-tight">{p.title}</h3>
                      {p.genre && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">
                          {p.genre}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 line-clamp-2 mb-2">{p.address || "住所なし"}</p>
                    <div className="flex items-center gap-3">
                      <span className={`text-[10px] font-bold ${p.visited ? 'text-green-600' : 'text-orange-500'}`}>
                        {p.visited ? '● 訪問済み' : '○ 未訪問'}
                      </span>
                      {p.prefecture && (
                        <span className="text-[10px] text-gray-400">
                          📍 {p.prefecture}
                        </span>
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
            <div className="p-6 border-b flex items-center justify-between bg-gray-50">
              <div>
                <h2 className="text-xl font-bold text-gray-900">詳細フィルター</h2>
                <p className="text-xs text-gray-500 mt-1">地域や都道府県で絞り込みます</p>
              </div>
              <button 
                onClick={() => setShowFilterPanel(false)}
                className="p-2 hover:bg-gray-200 rounded-full transition"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              <RegionFilter 
                regionClass={selectedRegionClass} 
                setRegionClass={setSelectedRegionClass} 
                selectedPrefectures={selectedPrefectures} 
                setSelectedPrefectures={setSelectedPrefectures} 
              />
            </div>

            <div className="p-6 border-t bg-gray-50">
              <button 
                onClick={() => setShowFilterPanel(false)}
                className="w-full py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 transition shadow-lg"
              >
                結果を表示する
              </button>
            </div>
          </aside>
        </div>
      )}

      <style jsx global>{`
        @keyframes slide-in-right {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #ddd;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #ccc;
        }
      `}</style>
    </div>
  );
}

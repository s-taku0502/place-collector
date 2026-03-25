"use client";

import { useEffect, useRef, useMemo, useState } from "react";
import RegionFilter from "@/components/RegionFilter";

type VisitFilter = "all" | "visited" | "unvisited";
type TravelMode = "DRIVING" | "WALKING" | "TRANSIT" | "BICYCLING";

export default function MapView({ title, places }: { title: string; places: any[] }) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<any[]>([]);
  const directionsRendererRef = useRef<any>(null);
  const infoWindowRef = useRef<any>(null);
  
  const [selectedRegionClass, setSelectedRegionClass] = useState<"A"|"B"|"C">("A");
  const [selectedPrefectures, setSelectedPrefectures] = useState<string[]>([]);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState<string>("all");
  const [visitFilter, setVisitFilter] = useState<VisitFilter>("all");
  const [hoveredPlaceId, setHoveredPlaceId] = useState<string | null>(null);
  const [currentLocation, setCurrentLocation] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  // 経路探索用の状態
  const [destination, setDestination] = useState<any>(null);
  const [routeInfo, setRouteInfo] = useState<{ distance: string; duration: string } | null>(null);
  const [travelMode, setTravelMode] = useState<TravelMode>("DRIVING");
  const [isSearchingRoute, setIsSearchingRoute] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const genres = useMemo(() => {
    if (!places) return [];
    const g = new Set<string>();
    places.forEach(p => { if (p.genre) g.add(p.genre); });
    return Array.from(g);
  }, [places]);

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

  // 地図の動的注入 & 初期化
  useEffect(() => {
    if (!isClient || !mapContainerRef.current) return;

    const mapId = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || "";
    mapContainerRef.current.innerHTML = `
      <gmp-map
        style="width: 100%; height: 100%;"
        center="36.2048,138.2529"
        zoom="5"
        map-id="${mapId}"
      >
        <div slot="control-block-start-inline-center" style="width: 100%; max-width: 380px; padding: 16px;">
          <gmpx-place-picker style="width: 100%; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);"></gmpx-place-picker>
        </div>
      </gmp-map>
    `;

    async function init() {
      if (typeof customElements !== 'undefined') {
        try {
          await customElements.whenDefined("gmp-map");
          const mapEl = mapContainerRef.current?.querySelector("gmp-map") as any;
          
          if (mapEl && window.google?.maps) {
            const targetMap = mapEl.innerMap || mapEl;
            
            // DirectionsRenderer の初期化
            directionsRendererRef.current = new window.google.maps.DirectionsRenderer({
              map: targetMap,
              suppressMarkers: false,
            });

            // InfoWindow の初期化 (共通インスタンス)
            infoWindowRef.current = new window.google.maps.InfoWindow();

            if (navigator.geolocation) {
              navigator.geolocation.getCurrentPosition(
                (position) => {
                  const pos = { lat: position.coords.latitude, lng: position.coords.longitude };
                  setCurrentLocation(`${pos.lat},${pos.lng}`);
                  if (targetMap && typeof targetMap.setCenter === 'function') {
                    targetMap.setCenter(pos);
                    targetMap.setZoom(13);
                  }
                },
                () => {
                  if (targetMap && typeof targetMap.setCenter === 'function') {
                    targetMap.setCenter({ lat: 36.2048, lng: 138.2529 });
                    targetMap.setZoom(5);
                  }
                }
              );
            }

            // Place Picker のイベントリスナー
            const picker = mapEl.querySelector("gmpx-place-picker");
            if (picker) {
              picker.addEventListener("gmpx-placechange", (e: any) => {
                const place = e.baseLayer.place;
                if (place && place.location) {
                  const loc = { lat: place.location.lat(), lng: place.location.lng() };
                  setDestination({ 
                    title: place.displayName || place.name, 
                    address: place.formattedAddress,
                    location: loc 
                  });
                }
              });
            }
          }
          
          setTimeout(() => updateMarkers(), 500);
        } catch (e) {
          console.error("Map initialization failed:", e);
        }
      }
    }

    const timer = setTimeout(init, 100);
    return () => clearTimeout(timer);
  }, [isClient]);

  // 経路探索の実行
  useEffect(() => {
    if (!isClient || !destination || !currentLocation || !window.google?.maps) return;

    const calculateRoute = async () => {
      setIsSearchingRoute(true);
      const directionsService = new window.google.maps.DirectionsService();
      
      const [lat, lng] = currentLocation.split(",").map(Number);
      const origin = { lat, lng };

      try {
        const result = await directionsService.route({
          origin: origin,
          destination: destination.location,
          travelMode: window.google.maps.TravelMode[travelMode],
        });

        if (directionsRendererRef.current) {
          directionsRendererRef.current.setDirections(result);
          const leg = result.routes[0].legs[0];
          setRouteInfo({
            distance: leg.distance?.text || "",
            duration: leg.duration?.text || "",
          });
        }
      } catch (e) {
        console.error("Directions request failed:", e);
        setRouteInfo(null);
      } finally {
        setIsSearchingRoute(false);
      }
    };

    calculateRoute();
  }, [destination, currentLocation, travelMode, isClient]);

  // 現在地マーカーの動的表示
  useEffect(() => {
    if (!isClient || !mapContainerRef.current) return;
    const mapEl = mapContainerRef.current.querySelector("gmp-map");
    if (!mapEl) return;

    const oldMarker = mapEl.querySelector('gmp-advanced-marker[title="現在地"]');
    if (oldMarker) oldMarker.remove();

    if (currentLocation && !destination) { // 経路表示中は現在地マーカーを隠す
      const marker = document.createElement('gmp-advanced-marker');
      marker.setAttribute('position', currentLocation);
      marker.setAttribute('title', '現在地');
      mapEl.appendChild(marker);
    }
  }, [currentLocation, destination, isClient]);

  const updateMarkers = async () => {
    if (!isClient || !mapContainerRef.current) return;
    const mapEl = mapContainerRef.current.querySelector("gmp-map") as any;
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
        
        marker.addListener("click", () => {
          if (infoWindowRef.current) {
            infoWindowRef.current.setContent(`
              <div style="padding:8px;color:#333">
                <strong>${p.title}</strong><br>
                <span style="font-size:12px;color:#666">${p.address || ""}</span><br>
                <span style="font-size:11px;font-weight:bold;color:${p.visited ? '#16a34a' : '#f97316'}">
                  ${p.visited ? '● 訪問済み' : '○ 未訪問'}
                </span>
              </div>
            `);
            infoWindowRef.current.open(targetMap, marker);
          }
        });
        markersRef.current.push(marker);
      }
    }
  };

  useEffect(() => {
    if (isClient) {
      const timer = setTimeout(updateMarkers, 300);
      return () => clearTimeout(timer);
    }
  }, [filteredPlaces, isClient]);

  const handlePlaceClick = async (p: any) => {
    if (!p.address || !isClient || !mapContainerRef.current) return;
    const mapEl = mapContainerRef.current.querySelector("gmp-map") as any;
    try {
      const geocoder = new window.google.maps.Geocoder();
      const res = await new Promise<any>((resolve, reject) =>
        geocoder.geocode({ address: p.address }, (results: any, status: any) => {
          if (status === "OK" && results?.[0]) resolve(results[0]);
          else reject(status);
        })
      );
      const loc = { lat: res.geometry.location.lat(), lng: res.geometry.location.lng() };
      const targetMap = mapEl.innerMap || mapEl;
      if (targetMap && typeof targetMap.setCenter === 'function') {
        targetMap.setCenter(loc);
        targetMap.setZoom(16);
      }
      setDestination({ title: p.title, address: p.address, location: loc });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e) {}
  };

  if (!isClient) return null;

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 font-sans overflow-x-hidden">
      {/* 1. 地図セクション */}
      <div 
        ref={mapContainerRef}
        className="w-full h-[450px] relative shrink-0 z-10 border-b bg-gray-100"
        suppressHydrationWarning
      >
        {/* ここに gmp-map が動的に注入されます */}
      </div>

      {/* 経路情報パネル (地図上にオーバーレイ) */}
      {destination && (
        <div className="fixed top-[460px] left-1/2 -translate-x-1/2 z-30 w-full max-w-lg px-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-blue-100 p-4 space-y-3">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-1">目的地への経路</p>
                <h3 className="text-lg font-extrabold text-gray-900 line-clamp-1">{destination.title}</h3>
              </div>
              <button 
                onClick={() => {
                  setDestination(null);
                  setRouteInfo(null);
                  if (directionsRendererRef.current) directionsRendererRef.current.setDirections({ routes: [] });
                }}
                className="p-1.5 hover:bg-gray-100 rounded-full text-gray-400 transition"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {(["DRIVING", "WALKING", "TRANSIT", "BICYCLING"] as TravelMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setTravelMode(mode)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${travelMode === mode ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                >
                  {mode === "DRIVING" && "🚗 車"}
                  {mode === "WALKING" && "🚶 徒歩"}
                  {mode === "TRANSIT" && "🚌 公共交通"}
                  {mode === "BICYCLING" && "🚲 自転車"}
                </button>
              ))}
            </div>

            {routeInfo ? (
              <div className="flex items-center justify-between bg-blue-50 rounded-xl p-3 border border-blue-100">
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <p className="text-[10px] text-blue-500 font-bold uppercase">距離</p>
                    <p className="text-lg font-black text-blue-700">{routeInfo.distance}</p>
                  </div>
                  <div className="w-px h-8 bg-blue-200"></div>
                  <div className="text-center">
                    <p className="text-[10px] text-blue-500 font-bold uppercase">所要時間</p>
                    <p className="text-lg font-black text-blue-700">{routeInfo.duration}</p>
                  </div>
                </div>
                <a 
                  href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination.address || destination.title)}&travelmode=${travelMode.toLowerCase()}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-blue-700 transition shadow-sm"
                >
                  ナビ開始
                </a>
              </div>
            ) : isSearchingRoute ? (
              <div className="flex items-center justify-center py-4 text-sm text-gray-400 animate-pulse">
                経路を計算中...
              </div>
            ) : (
              <div className="text-center py-2 text-xs text-red-500 font-bold">
                経路が見つかりませんでした
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. フィルター & リストセクション */}
      <div className={`w-full max-w-4xl mx-auto px-4 py-6 space-y-6 ${destination ? 'mt-40' : ''}`}>
        
        {/* 訪問ステータスフィルター */}
        <div className="flex items-center justify-center gap-3 bg-white p-2 rounded-2xl shadow-sm border border-gray-100">
          {(["all", "visited", "unvisited"] as VisitFilter[]).map((f) => (
            <button 
              key={f}
              onClick={() => setVisitFilter(f)}
              className={`flex-1 py-3 rounded-xl font-bold transition-all text-sm ${visitFilter === f ? 'bg-blue-600 text-white shadow-md shadow-blue-200' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}
            >
              {f === "all" ? "すべて" : f === "visited" ? "行った" : "未訪問"}
            </button>
          ))}
        </div>

        {/* 検索 & ジャンル & 地域 */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="場所名や住所で検索..."
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm outline-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <svg className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <button 
              onClick={() => setShowFilterPanel(true)}
              className={`p-3 border rounded-xl transition shadow-sm ${selectedPrefectures.length > 0 ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
              title="地域フィルター"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L14 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 018 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
              </svg>
            </button>
          </div>

          <select 
            className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-medium text-gray-700 appearance-none"
            value={selectedGenre}
            onChange={(e) => setSelectedGenre(e.target.value)}
            style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%236b7280\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'%3E%3C/path%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1.25rem' }}
          >
            <option value="all">すべてのジャンル</option>
            {genres.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>

        {/* リスト表示部分 */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <h2 className="text-xl font-extrabold text-gray-900 tracking-tight">
              {visitFilter === "all" ? "すべての場所" : visitFilter === "visited" ? "行った場所" : "まだ行ってない場所"}
            </h2>
            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100 shadow-sm">
              {filteredPlaces.length}件
            </span>
          </div>

          {filteredPlaces.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-gray-200 text-gray-400 px-8 text-center">
              <p className="text-base font-medium">該当する場所が見つかりません</p>
              <button onClick={() => {setSearchQuery(""); setSelectedGenre("all"); setSelectedPrefectures([]); setVisitFilter("all");}} className="mt-4 text-blue-600 font-bold hover:underline">フィルターをリセット</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-20">
              {filteredPlaces.map((p: any) => (
                <div 
                  key={p._id}
                  onMouseEnter={() => setHoveredPlaceId(p._id)}
                  onMouseLeave={() => setHoveredPlaceId(null)}
                  onClick={() => handlePlaceClick(p)}
                  className={`p-5 bg-white rounded-2xl shadow-sm border transition-all duration-200 cursor-pointer ${hoveredPlaceId === p._id ? 'ring-2 ring-blue-500 shadow-lg transform -translate-y-1' : 'border-gray-100 hover:border-blue-200 hover:shadow-md'}`}
                >
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <h3 className="font-bold text-gray-900 text-base line-clamp-1 flex-1">{p.title}</h3>
                    {p.genre && (
                      <span className="shrink-0 text-[10px] px-2 py-1 rounded-full bg-gray-100 text-gray-500 font-bold">
                        {p.genre}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 line-clamp-2 mb-4 leading-relaxed">{p.address || "住所なし"}</p>
                  <div className="flex items-center justify-between border-t pt-3">
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${p.visited ? 'bg-green-500' : 'bg-orange-500'}`}></span>
                      <span className={`text-xs font-bold ${p.visited ? 'text-green-600' : 'text-orange-500'}`}>
                        {p.visited ? '訪問済み' : '未訪問'}
                      </span>
                    </div>
                    {p.prefecture && (
                      <span className="text-xs text-gray-400 font-medium">📍 {p.prefecture}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
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
        @keyframes fade-in { from { opacity: 0; transform: translate(-50%, 20px); } to { opacity: 1; transform: translate(-50%, 0); } }
        .animate-fade-in { animation: fade-in 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}

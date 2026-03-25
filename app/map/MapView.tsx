"use client";

import { useEffect, useRef, useMemo, useState } from "react";
import RegionFilter from "@/components/RegionFilter";

export default function MapView({ title, places }: { title: string; places: any[] }) {
  const mapReady = useRef(false);
  const markersRef = useRef<any[]>([]);
  const [selectedRegionClass, setSelectedRegionClass] = useState<"A"|"B"|"C">("A");
  const [selectedPrefectures, setSelectedPrefectures] = useState<string[]>([]);
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && showFilterPanel) setShowFilterPanel(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showFilterPanel]);

  const filteredPlaces = useMemo(() => {
    if (!places) return [];
    if (selectedPrefectures.length === 0) return places;
    return places.filter((p: any) => p.prefecture && selectedPrefectures.includes(p.prefecture));
  }, [places, selectedPrefectures]);
  useEffect(() => {
    let retry: NodeJS.Timeout;
    async function init() {
      await customElements.whenDefined("gmp-map");
      mapReady.current = true;
    }
    async function createMarkers() {
      if (typeof window === "undefined" || !window.google || !window.google.maps) return;
      const geocoder = new window.google.maps.Geocoder();
      const mapEl = document.querySelector("gmp-map") as any;
      // clear old markers
      markersRef.current.forEach((m) => m && m.setMap && m.setMap(null));
      markersRef.current = [];

      if (!mapEl) return;

      // helper: map category/genre to marker color
      const colorForGenre = (genre?: string) => {
        if (!genre) return "";
        const key = (genre || "").toLowerCase();
        if (key.includes("food") || key.includes("飲食") || key.includes("グルメ")) return "orange";
        if (key.includes("cafe") || key.includes("カフェ")) return "purple";
        if (key.includes("park") || key.includes("公園")) return "green";
        if (key.includes("shop") || key.includes("ショップ")) return "blue";
        if (key.includes("museum") || key.includes("美術館") || key.includes("博物")) return "yellow";
        return "";
      };

      for (const p of filteredPlaces || []) {
        try {
          let loc: any = null;
          // if stored lat/lng available
          if (p.location && typeof p.location === "object" && (p.location.lat || p.location.lng)) {
            loc = { lat: Number(p.location.lat), lng: Number(p.location.lng) };
          } else if (p.address) {
            // geocode
            // eslint-disable-next-line no-await-in-loop
            const res = await new Promise<any>((resolve, reject) =>
              geocoder.geocode({ address: p.address }, (results: any, status: any) => {
                if (status === "OK" && results && results[0]) resolve(results[0]);
                else reject(status);
              })
            ).catch(() => null);
            if (res && res.geometry && res.geometry.location) {
              const g = res.geometry.location;
              loc = { lat: g.lat(), lng: g.lng() };
            }
          }

          if (!loc) continue;

          // create native marker when innerMap available
          if (mapEl && mapEl.innerMap) {
            const color = colorForGenre(p.genre);
            const iconUrl = `https://maps.google.com/mapfiles/ms/icons/${color}-dot.png`;
            const marker = new window.google.maps.Marker({
              position: loc,
              map: mapEl.innerMap,
              title: p.title || "",
              icon: { url: iconUrl },
            });
            const infow = new window.google.maps.InfoWindow({ content: `<strong>${p.title || ""}</strong><br>${p.address || ""}` });
            marker.addListener("click", () => infow.open(mapEl.innerMap, marker));
            markersRef.current.push(marker);
          } else if (mapEl) {
            // fallback: set gmp-advanced-marker if available
            const adv = document.createElement("gmp-advanced-marker");
            adv.setAttribute("position", `${loc.lat},${loc.lng}`);
            adv.setAttribute("data-title", p.title || "");
            mapEl.appendChild(adv);
            markersRef.current.push(adv);
          }
        } catch (e) {
          // ignore individual failures
        }
      }
    }
    function tryInit() {
      if (typeof window !== "undefined" && window.google && window.google.maps) {
        init();
      } else {
        retry = setTimeout(tryInit, 500);
      }
    }
    tryInit();
    return () => {
      retry && clearTimeout(retry);
      // cleanup markers
      markersRef.current.forEach((m) => m && m.setMap && m.setMap(null));
      markersRef.current = [];
    };
  }, [filteredPlaces]);

  // when places change, refresh markers
  useEffect(() => {
    if (!mapReady.current) return;
    const el = document.querySelector("gmp-map");
    if (!el) return;
    // create markers after a tiny delay to ensure innerMap ready
    const t = setTimeout(() => {
      (async () => {
        // reuse createMarkers logic by calling the inner function defined above is not possible here,
        // so duplicate minimal logic: trigger a geocode/marker creation via a click on map to reuse existing init flow
        // Simpler: directly create markers using global google
        if (typeof window === "undefined" || !window.google || !window.google.maps) return;
        const geocoder = new window.google.maps.Geocoder();
        const mapEl = document.querySelector("gmp-map") as any;
        markersRef.current.forEach((m) => m && m.setMap && m.setMap(null));
        markersRef.current = [];
        const colorForGenre = (genre?: string) => {
          if (!genre) return "red";
          const key = (genre || "").toLowerCase();
          if (key.includes("food") || key.includes("飲食") || key.includes("グルメ")) return "orange";
          if (key.includes("cafe") || key.includes("カフェ")) return "purple";
          if (key.includes("park") || key.includes("公園")) return "green";
          if (key.includes("shop") || key.includes("ショップ")) return "blue";
          if (key.includes("museum") || key.includes("美術館") || key.includes("博物")) return "yellow";
          return "red";
        };
        for (const p of places || []) {
          try {
            let loc: any = null;
            if (p.location && typeof p.location === "object" && (p.location.lat || p.location.lng)) {
              loc = { lat: Number(p.location.lat), lng: Number(p.location.lng) };
            } else if (p.address) {
              // eslint-disable-next-line no-await-in-loop
              const res = await new Promise<any>((resolve, reject) =>
                geocoder.geocode({ address: p.address }, (results: any, status: any) => {
                  if (status === "OK" && results && results[0]) resolve(results[0]);
                  else reject(status);
                })
              ).catch(() => null);
              if (res && res.geometry && res.geometry.location) {
                const g = res.geometry.location;
                loc = { lat: g.lat(), lng: g.lng() };
              }
            }
            if (!loc) continue;
            if (mapEl && mapEl.innerMap) {
              const color = colorForGenre(p.genre);
              const iconUrl = `https://maps.google.com/mapfiles/ms/icons/${color}-dot.png`;
              const marker = new window.google.maps.Marker({
                position: loc,
                map: mapEl.innerMap,
                title: p.title || "",
                icon: { url: iconUrl },
              });
              const infow = new window.google.maps.InfoWindow({ content: `<strong>${p.title || ""}</strong><br>${p.address || ""}` });
              marker.addListener("click", () => infow.open(mapEl.innerMap, marker));
              markersRef.current.push(marker);
            } else if (mapEl) {
              const adv = document.createElement("gmp-advanced-marker");
              adv.setAttribute("position", `${loc.lat},${loc.lng}`);
              adv.setAttribute("data-title", p.title || "");
              mapEl.appendChild(adv);
              markersRef.current.push(adv);
            }
          } catch (e) {
            // ignore
          }
        }
      })();
    }, 300);
    return () => clearTimeout(t);
  }, [filteredPlaces]);

  return (
    <main>
      <h1 className="text-2xl font-bold mb-4">{title}</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div style={{ width: "100%", height: "70vh", position: "relative" }}>
            <gmp-map
              style={{ width: "100%", height: "100%" }}
              center="35.681236,139.767125"
              zoom="13"
              map-id={process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || ""}
            >
              {/* selected marker */}
              <gmp-advanced-marker id="map-selected-marker" position="35.681236,139.767125"></gmp-advanced-marker>
            </gmp-map>

            <div style={{ position: "absolute", top: 16, left: "50%", transform: "translateX(-50%)", zIndex: 1000 }}>
              <gmpx-place-picker style={{ width: 320 }}></gmpx-place-picker>
            </div>
          </div>
        </div>

        <aside className="space-y-3">
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <h2 className="font-semibold">フィルター</h2>
            <div className="mt-3">
              <RegionFilter
                regionClass={selectedRegionClass}
                setRegionClass={setSelectedRegionClass}
                selectedPrefectures={selectedPrefectures}
                setSelectedPrefectures={setSelectedPrefectures}
              />
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm">
            <h2 className="font-semibold">場所一覧 ({filteredPlaces.length})</h2>
            <ul className="mt-3 space-y-2 max-h-[60vh] overflow-y-auto">
              {filteredPlaces.map((p: any) => (
                <li key={p._id}>
                  <button
                    onClick={async () => {
                      if (!p.address) return alert("住所が設定されていません");
                      if (!window.google || !window.google.maps) return alert("地図が読み込まれていません");
                      const geocoder = new window.google.maps.Geocoder();
                      try {
                        const res = await new Promise<any>((resolve, reject) =>
                          geocoder.geocode({ address: p.address }, (results: any, status: any) => {
                            if (status === "OK" && results && results[0]) resolve(results[0]);
                            else reject(status);
                          })
                        );
                        const loc = res.geometry.location;
                        const map = document.querySelector("gmp-map") as any;
                        const marker = document.querySelector("#map-selected-marker") as any;
                        if (map && map.innerMap) {
                          map.innerMap.setCenter(loc);
                          map.innerMap.setZoom(16);
                        } else if (map) {
                          map.center = `${loc.lat()},${loc.lng()}`;
                        }
                        if (marker) marker.position = { lat: loc.lat(), lng: loc.lng() };
                        // show info window
                        const infow = new window.google.maps.InfoWindow({ content: `<strong>${p.title}</strong><br>${p.address ?? ""}` });
                        if (marker && map && map.innerMap) infow.open(map.innerMap, marker);
                      } catch (err) {
                        alert("位置を特定できませんでした");
                      }
                    }}
                    className="w-full text-left"
                  >
                    <div className="p-2 rounded hover:bg-gray-100">
                      <div className="font-medium">{p.title}</div>
                      <div className="text-sm text-gray-500">{p.address ?? "住所なし"}</div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>

      {/* フローティング絞り込みボタン */}
      <button onClick={() => setShowFilterPanel(true)} className="fixed bottom-8 right-8 z-40 inline-flex items-center gap-2 rounded-full bg-white p-3 shadow-lg hover:shadow-2xl transition">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L14 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 018 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
        </svg>
      </button>

      {showFilterPanel && (
        <div className="fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black bg-opacity-30" onClick={() => setShowFilterPanel(false)} />
          <aside className="ml-auto w-full max-w-md h-full bg-white shadow-xl p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">絞り込み</h2>
              <button onClick={() => setShowFilterPanel(false)} className="text-gray-600 hover:text-gray-900">✕</button>
            </div>
            <RegionFilter regionClass={selectedRegionClass} setRegionClass={setSelectedRegionClass} selectedPrefectures={selectedPrefectures} setSelectedPrefectures={setSelectedPrefectures} />
          </aside>
        </div>
      )}
    </main>
  );
}

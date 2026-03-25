"use client";

import { useEffect, useRef } from "react";

export default function MapView({ title, places }: { title: string; places: any[] }) {
  const mapReady = useRef(false);
  useEffect(() => {
    let retry: NodeJS.Timeout;
    async function init() {
      // @ts-ignore
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

  return (
    <main>
      <h1 className="text-2xl font-bold mb-4">{title}</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div style={{ width: "100%", height: "70vh", position: "relative" }}>
            {/* @ts-ignore */}
            <gmp-map
              style={{ width: "100%", height: "100%" }}
              center="35.681236,139.767125"
              zoom="13"
              map-id={process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || ""}
            >
              {/* selected marker */}
              {/* @ts-ignore */}
              <gmp-advanced-marker id="map-selected-marker" position="35.681236,139.767125"></gmp-advanced-marker>
            {/* @ts-ignore */}
            </gmp-map>

            <div style={{ position: "absolute", top: 16, left: "50%", transform: "translateX(-50%)", zIndex: 1000 }}>
              {/* @ts-ignore */}
              <gmpx-place-picker style={{ width: 320 }}></gmpx-place-picker>
            </div>
          </div>
        </div>

        <aside className="space-y-3">
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <h2 className="font-semibold">場所一覧 ({places.length})</h2>
            <ul className="mt-3 space-y-2 max-h-[60vh] overflow-y-auto">
              {places.map((p: any) => (
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
    </main>
  );
}

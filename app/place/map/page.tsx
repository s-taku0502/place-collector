"use client";
import { useEffect } from "react";

export default function PlaceMapPage() {
    useEffect(() => {
        let retryTimeout: NodeJS.Timeout;
        async function init() {
            // Google Maps Platformのカスタム要素が定義されるのを待つ
            // @ts-ignore
            await customElements.whenDefined("gmp-map");
            // @ts-ignore
            const map = document.querySelector("gmp-map");
            // @ts-ignore
            const marker = document.querySelector("gmp-advanced-marker");
            // @ts-ignore
            const placePicker = document.querySelector("gmpx-place-picker");
            // @ts-ignore
            const infowindow = new window.google.maps.InfoWindow();

            // @ts-ignore
            map.innerMap.setOptions({ mapTypeControl: false });

            placePicker?.addEventListener("gmpx-placechange", () => {
                // @ts-ignore
                const place = placePicker.value;
                if (!place.location) {
                    window.alert("No details available for input: '" + place.name + "'");
                    infowindow.close();
                    marker.position = null;
                    return;
                }
                if (place.viewport) {
                    map.innerMap.fitBounds(place.viewport);
                } else {
                    map.center = place.location;
                    map.zoom = 17;
                }
                marker.position = place.location;
                infowindow.setContent(
                    `<strong>${place.displayName}</strong><br><span>${place.formattedAddress}</span>`
                );
                infowindow.open(map.innerMap, marker);
            });
        }
        function tryInit() {
            if (typeof window !== "undefined" && window.google && window.google.maps) {
                init();
            } else {
                // Google Maps JS APIがまだ読み込まれていない場合はリトライ
                retryTimeout = setTimeout(tryInit, 500);
            }
        }
        tryInit();
        return () => {
            if (retryTimeout) clearTimeout(retryTimeout);
        };
    }, []);

    // Google Maps JS APIのscriptは_app.tsxやlayout.tsxで読み込んでおく必要あり
    return (
        <div style={{ width: "100%", height: "80vh", position: "relative" }}>
            {/* Google Maps Web Components: map-id属性はGoogle Cloud Consoleで作成したMap IDに置き換えてください */}
            <gmp-map
                style={{ width: "100%", height: "100%" }}
                center="35.681236,139.767125"
                zoom="13"
                map-id={process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || undefined}
            >
                {/* 初期位置のマーカー（東京駅） */}
                <gmp-advanced-marker position="35.681236,139.767125"></gmp-advanced-marker>
            </gmp-map>
            <div
                style={{
                    position: "absolute",
                    top: 16,
                    left: "50%",
                    transform: "translateX(-50%)",
                    zIndex: 1000,
                    background: "rgba(255,255,255,0.95)",
                    borderRadius: 8,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                    padding: 8,
                    minWidth: 260,
                    maxWidth: "90vw",
                }}
                aria-label="場所を検索"
            >
                <gmpx-place-picker style={{ width: "100%" }}></gmpx-place-picker>
            </div>
        </div>
    );
}

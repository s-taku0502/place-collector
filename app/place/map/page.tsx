"use client";
import { useEffect } from "react";

export default function PlaceMapPage() {
    useEffect(() => {
        let retryTimeout: NodeJS.Timeout;
        async function init() {
            // @ts-ignore
            await customElements.whenDefined("gmp-map");
            
            const map = document.querySelector("gmp-map") as any;
            const marker = document.querySelector("gmp-advanced-marker") as any;
            const placePicker = document.querySelector("gmpx-place-picker") as any;
            
            if (!map || !placePicker) return;

            // @ts-ignore
            const infowindow = new window.google.maps.InfoWindow();

            if (map.innerMap) {
                map.innerMap.setOptions({ mapTypeControl: false });
            }

            placePicker.addEventListener("gmpx-placechange", () => {
                const place = placePicker.value;
                if (!place || !place.location) {
                    if (place) {
                        window.alert("No details available for input: '" + place.name + "'");
                    }
                    infowindow.close();
                    if (marker) marker.position = null;
                    return;
                }

                if (place.viewport) {
                    map.innerMap.fitBounds(place.viewport);
                } else {
                    map.center = place.location;
                    map.zoom = 17;
                }

                if (marker) {
                    marker.position = place.location;
                }

                infowindow.setContent(
                    `<strong>${place.displayName || place.name}</strong><br><span>${place.formattedAddress || ""}</span>`
                );
                infowindow.open(map.innerMap, marker);
            });
        }

        function tryInit() {
            // @ts-ignore
            if (typeof window !== "undefined" && window.google && window.google.maps) {
                init();
            } else {
                retryTimeout = setTimeout(tryInit, 500);
            }
        }
        tryInit();
        return () => {
            if (retryTimeout) clearTimeout(retryTimeout);
        };
    }, []);

    return (
        <div style={{ width: "100%", height: "80vh", position: "relative" }}>
            {/* @ts-ignore */}
            <gmp-map
                style={{ width: "100%", height: "100%" }}
                center="35.681236,139.767125"
                zoom="13"
                map-id={process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || ""}
            >
                {/* @ts-ignore */}
                <gmp-advanced-marker position="35.681236,139.767125"></gmp-advanced-marker>
            {/* @ts-ignore */}
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
                {/* @ts-ignore */}
                <gmpx-place-picker style={{ width: "100%" }}></gmpx-place-picker>
            </div>
        </div>
    );
}

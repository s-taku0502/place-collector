import React from "react";

declare global {
    namespace JSX {
        interface IntrinsicElements {
            "gmpx-place-picker": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
                placeholder?: string;
                class?: string;
                style?: React.CSSProperties;
            };
            "gmp-map": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
                center?: string | google.maps.LatLngLiteral;
                zoom?: string | number;
                "map-id"?: string;
                style?: React.CSSProperties;
            };
            "gmp-advanced-marker": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
                position?: string | google.maps.LatLngLiteral | null;
            };
        }
    }
}

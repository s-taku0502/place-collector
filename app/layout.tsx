import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ConvexAuthNextjsServerProvider } from "@convex-dev/auth/nextjs/server";
import ConvexClientProvider from "@/components/ConvexClientProvider";
import Header from "@/components/Header";
import Script from "next/script";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "spotstock / 行きたい場所リスト！",
  description: "行きたい場所を管理するアプリケーションです。みんなで「行きたい」を集めよう！",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ConvexAuthNextjsServerProvider>
      <html lang="ja">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <ConvexClientProvider>
            <Header />
            {children}
          </ConvexClientProvider>
          {/* 
            Google Maps JavaScript API の動的読み込み用ブートストラップスクリプト。
            Extended Component Library が必要とする importLibrary 関数を有効化します。
          */}
          <Script
            id="google-maps-loader"
            strategy="beforeInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                (g=>{var h,a,k,p="The Google Maps JavaScript API",c="google",l="importLibrary",q="__ib__",m=document,b=window;b=b[c]||(b[c]={});var d=b.maps||(b.maps={}),r=new Set,e=new URLSearchParams,u=()=>h||(h=new Promise(async(f,n)=>{await (a=m.createElement("script"));e.set("libraries",[...r]+"");for(k in g)e.set(k.replace(/[A-Z]/g,t=>"_"+t[0].toLowerCase()),g[k]);e.set("callback",c+".maps."+q);a.src=\`https://maps.\${c}apis.com/maps/api/js?\`+e;d[q]=f;a.onerror=()=>h=n(Error(p+" could not load."));a.nonce=m.querySelector("script[nonce]")?.nonce||"";m.head.append(a)}));d[l]?(console.warn(p+" only loads once. Ignoring:",g),u()):d[l]=(f,...n)=>r.add(f)&&u().then(()=>d[l](f,...n))})({
                  key: "${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}",
                  v: "beta",
                  libraries: "places"
                });
              `,
            }}
          />
          <Script
            type="module"
            src="https://unpkg.com/@googlemaps/extended-component-library"
            strategy="afterInteractive"
            crossOrigin="anonymous"
          />
        </body>
      </html>
    </ConvexAuthNextjsServerProvider>
  );
}

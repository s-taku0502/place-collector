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
  keywords: [
    "行きたい場所", "スポット", "リスト", "共有", "旅行", "観光", "スポット管理", "スポット共有", "旅行計画", "観光スポット",
    "行きたい場所リスト", "spotstock", "行きたい場所アプリ", "スポットコレクション", "旅行スポット", "観光地", "スポットブックマーク",
    "行きたい場所共有", "場所管理", "旅行計画アプリ", "観光スポット管理", "スポットマップ", "行きたい場所マップ", "スポットレビュー",
    "旅行スポットレビュー", "観光地レビュー", "スポット評価", "行きたい場所評価", "ポケット地図", "旅行ポケット地図", "観光地ポケット地図",
    "スポットリスト", "行きたい場所リストアプリ", "旅行スポットリスト", "観光地リスト", "スポット共有アプリ", "行きたい場所共有アプリ",
    "旅行スポット共有アプリ", "観光地共有アプリ", "お出かけリスト", "デートスポット", "カフェ巡り", "マイマップ", "場所の備忘録",
    "インスタ映えスポット", "穴場スポット", "聖地巡礼", "位置情報メモ", "スポットストック", "週末お出かけ", "ドライブ計画", "行きたいカフェ",
    "グルメ備忘録", "ランチ候補", "美味しいお店リスト", "ロケ地巡り", "美術館巡り", "キャンプ場リスト", "サウナリスト", "SNS話題の場所",
    "TikTokスポット", "保存済みスポット", "忘れないメモ", "お気に入りマップ", "カテゴリ別管理", "ステータス管理", "タグ付け管理", "爆速管理",
    "シンプル地図", "直感操作", "マップアプリ連携", "Convex", "Next.js", "Google Maps API", "モダンWebアプリ", "SpotStock", "Spot Stock",
    "Place to visit", "Bucket list", "Travel bucket list", "Map bookmarks", "My places", "Travel planner"
  ],
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

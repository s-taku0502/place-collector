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
          <Script
            src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places&v=beta`}
            strategy="afterInteractive"
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

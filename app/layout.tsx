import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { validateEnv } from "@/lib/env";
import { initializeApp } from "@/lib/init";
import Providers from "./providers";
import ConditionalBottomNavBar from "@/components/layout/ConditionalBottomNavBar";
import ConditionalPushNotification from "@/components/ConditionalPushNotification";

if (typeof window === "undefined") {
  validateEnv();
  initializeApp().catch((err) => console.error("[Layout] 초기화 오류:", err));
}

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "크루즈 가이드 - AI 여행 도우미",
  description: "AI 가이드 지니와 함께하는 특별한 크루즈 여행",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#E50914" />
        <meta name="pinterest" content="nopin" />
        <meta name="pinterest-rich-pin" content="false" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/images/ai-cruise-logo.png" type="image/png" sizes="512x512" />
      </head>
      <body className={inter.className}>
        <Providers>
          <div className="pb-20" style={{ paddingBottom: "calc(5rem + env(safe-area-inset-bottom))" }}>
            {children}
          </div>
          <ConditionalBottomNavBar />
          <ConditionalPushNotification />
        </Providers>
      </body>
    </html>
  );
}


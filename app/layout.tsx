import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { Inter } from "next/font/google";
import TabBar from "@/components/TabBar";
import AppHeader from "@/components/AppHeader";
import RegisterServiceWorker from "@/components/RegisterServiceWorker";
import AnalyticsProvider from "@/components/AnalyticsProvider";
import { EVENT } from "@/lib/event";
import "./globals.css";

// next/font downloads Inter at build time and serves it from our own origin,
// so there is no request to Google's CDN at runtime — faster on venue wifi,
// and no third-party font call to explain under GDPR.
const inter = Inter({
  subsets: ["latin", "latin-ext"], // latin-ext carries ø, æ, å
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: EVENT.name,
  description: `Live programme, updates and networking for ${EVENT.fullName}`,
  manifest: "/manifest.json",
  // Next emits the modern `mobile-web-app-capable`, which iOS only started
  // honouring in 16.4. Older iPhones read the Apple-prefixed name and nothing
  // else, and without it they open the icon in a browser chrome rather than
  // standalone - so both are declared.
  other: { "apple-mobile-web-app-capable": "yes" },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: EVENT.name,
    // iOS shows a blank canvas while an installed app boots unless it finds a
    // launch image matching the device exactly - there is no scaling and no
    // fallback, so an unlisted size gets white. Regenerate with
    // `node scripts/gen-splash.mjs` if the icon or the brand colour changes.
    startupImage: [
      {
        url: "/splash/splash-640x1136.png",
        media:
          "(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)",
      },
      {
        url: "/splash/splash-750x1334.png",
        media:
          "(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)",
      },
      {
        url: "/splash/splash-1242x2208.png",
        media:
          "(device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)",
      },
      {
        url: "/splash/splash-1125x2436.png",
        media:
          "(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)",
      },
      {
        url: "/splash/splash-828x1792.png",
        media:
          "(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)",
      },
      {
        url: "/splash/splash-1242x2688.png",
        media:
          "(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)",
      },
      {
        url: "/splash/splash-1170x2532.png",
        media:
          "(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)",
      },
      {
        url: "/splash/splash-1284x2778.png",
        media:
          "(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)",
      },
      {
        url: "/splash/splash-1179x2556.png",
        media:
          "(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)",
      },
      {
        url: "/splash/splash-1290x2796.png",
        media:
          "(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)",
      },
      {
        url: "/splash/splash-1206x2622.png",
        media:
          "(device-width: 402px) and (device-height: 874px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)",
      },
      {
        url: "/splash/splash-1320x2868.png",
        media:
          "(device-width: 440px) and (device-height: 956px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)",
      },
    ],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#4309ff",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-dvh">
        {/* AppHeader makes three Supabase round trips before it can render.
            Rendered bare, it holds up the whole document: nothing paints until
            they finish, which on mobile data is the blank launch people see.
            Behind Suspense the shell flushes immediately and the bar fills in,
            so the skeleton must be exactly the header's height or the page
            jumps as it arrives. */}
        <Suspense
          fallback={
            <div
              style={{ height: "var(--app-header-h)" }}
              className="sticky top-0 z-40 bg-[var(--color-accent)]"
            />
          }
        >
          <AppHeader />
        </Suspense>
        <main className="mx-auto w-full max-w-screen-sm px-4 pt-4">{children}</main>
        <noscript>
          <p className="p-4 text-sm">AIMC-CC needs JavaScript enabled.</p>
        </noscript>
        <TabBar />
        <RegisterServiceWorker />
        <AnalyticsProvider />
      </body>
    </html>
  );
}

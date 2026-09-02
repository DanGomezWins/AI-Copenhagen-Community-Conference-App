import type { Metadata, Viewport } from "next";
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
  appleWebApp: { capable: true, statusBarStyle: "default", title: EVENT.name },
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
        <AppHeader />
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

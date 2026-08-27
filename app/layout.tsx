import type { Metadata, Viewport } from "next";
import TabBar from "@/components/TabBar";
import AppHeader from "@/components/AppHeader";
import RegisterServiceWorker from "@/components/RegisterServiceWorker";
import { EVENT } from "@/lib/event";
import "./globals.css";

export const metadata: Metadata = {
  title: EVENT.name,
  description:
    "Live program, updates and networking for AI Meetup Copenhagen Community Conference #1",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "default", title: EVENT.short },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#0f1115",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-dvh">
        <AppHeader />
        <main className="mx-auto w-full max-w-screen-sm px-4 pt-4">{children}</main>
        <noscript>
          <p className="p-4 text-sm">AIC Info needs JavaScript enabled.</p>
        </noscript>
        <TabBar />
        <RegisterServiceWorker />
      </body>
    </html>
  );
}

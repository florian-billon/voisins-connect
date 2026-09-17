import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "./providers";
import NotificationSystem from "@/components/notifications/NotificationSystem";
import ServiceWorkerRegister from "./sw-register";
import PushNotificationManager from "@/components/notifications/PushNotificationManager";

export const metadata: Metadata = {
  title: "voisins_connect",
  description: "Application de quartier pour connecter les voisins",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "voisins_connect",
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#3b82f6",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className="w-full" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="theme-color" content="#3b82f6" />
      </head>
      <body className="w-full min-h-screen font-medium text-white font-[system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif] antialiased [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-[#5b8cff]/50 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:hover:bg-[#5b8cff] [&::-webkit-scrollbar-track]:bg-black/30">
        <Providers>
          <ServiceWorkerRegister />
          <div className="relative w-full min-h-screen bg-[url('/background-clouds.png')] bg-cover bg-center bg-no-repeat brightness-[0.7] contrast-[1.1]">
            {children}
          </div>
          <NotificationSystem />
          <PushNotificationManager />
        </Providers>
      </body>
    </html>
  );
}

import type { Metadata, Viewport } from "next";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { ServiceWorkerRegister } from "@/components/pwa/ServiceWorkerRegister";
import { ToastHost } from "@/components/ui/ToastHost";
import "./globals.css";

export const metadata: Metadata = {
  title: "paperBrain",
  description:
    "A personal notes app for capturing research, linking ideas, and finding them fast.",
  applicationName: "paperBrain",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "paperBrain",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      {
        url: "/icons/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f3ef" },
    { media: "(prefers-color-scheme: dark)", color: "#1c1c1a" },
  ],
  colorScheme: "light dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="default"
        />
        <meta name="apple-mobile-web-app-title" content="paperBrain" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <link rel="icon" href="/icons/icon-192.png" type="image/png" />
      </head>
      <body className="antialiased">
        <QueryProvider>{children}</QueryProvider>
        <ToastHost />
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}

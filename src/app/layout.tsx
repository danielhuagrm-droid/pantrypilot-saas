import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { PwaRegister } from "@/components/PwaRegister";

export const metadata: Metadata = {
  title: "PantryPilot — Gestor inteligente de despensa y comidas",
  description:
    "De tu recibo del supermercado a tus comidas de la semana. Organiza tu despensa por zonas, cocina con cantidades reales y reduce el desperdicio de alimentos.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "PantryPilot",
  },
};

export const viewport: Viewport = {
  themeColor: "#059669",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="font-sans antialiased min-h-screen bg-[#f6f8f7] text-slate-900">
        <PwaRegister />
        {children}
        <Analytics />
      </body>
    </html>
  );
}

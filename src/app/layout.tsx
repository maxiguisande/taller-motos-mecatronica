import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { PWARegister } from "@/components/pwa-register";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Mecatrónica Pilar — Taller de Motos",
  description: "Gestión de clientes, servicios y órdenes de trabajo",
  applicationName: "Mecatrónica",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Mecatrónica",
  },
  icons: {
    icon: "/icon-192.png",
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#0f1a22",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full bg-slate-100 text-slate-900">
        {children}
        <PWARegister />
      </body>
    </html>
  );
}

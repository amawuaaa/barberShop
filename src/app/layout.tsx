import type { Metadata } from "next";
import { Syne, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const display = Syne({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-display",
});

const sans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "SIGMABARBER — Cambio de imagen",
  description:
    "SIGMABARBER. Tu imagen habla antes que tú. Reserva online tu cita con atención personalizada.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover" as const,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${display.variable} ${sans.variable} h-full`}>
      <body className="min-h-full flex flex-col font-sans antialiased">
        {children}
      </body>
    </html>
  );
}

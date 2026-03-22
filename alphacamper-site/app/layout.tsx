import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const outfit = Outfit({
  variable: "--font-momo",
  subsets: ["latin"],
  display: "swap",
});

export const viewport = {
  width: 'device-width',
  initialScale: 1,
}

export const metadata: Metadata = {
  title: "Alphacamper — The unfair advantage for booking campsites.",
  description:
    "The ultimate campsite booking bot. 0ms Auto-fill for opening day and 24/7 cancellation scanning for sold-out parks. Get the site everyone else missed.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${outfit.variable}`}>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}

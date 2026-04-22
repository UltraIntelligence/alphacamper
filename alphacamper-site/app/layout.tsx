import type { Metadata } from "next";
import { Inter, Instrument_Serif, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

// Display serif — editorial confidence, readable over map tiles.
// `--font-momo` alias kept for CSS referencing that variable during migration.
const instrumentSerif = Instrument_Serif({
  variable: "--font-momo",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
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
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${instrumentSerif.variable} ${jetbrainsMono.variable}`}
    >
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}

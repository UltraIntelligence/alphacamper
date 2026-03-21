import type { Metadata } from "next";
import { Inter, Momo_Trust_Display } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const momoTrust = Momo_Trust_Display({
  variable: "--font-momo",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Alphacamper — Stop refreshing. Start camping.",
  description:
    "Alphacamper watches sold-out campgrounds 24/7 for cancellations. When a spot opens up, you hear about it first. Free to start.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${momoTrust.variable}`}>
      <body>{children}</body>
    </html>
  );
}

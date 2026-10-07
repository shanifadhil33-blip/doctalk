import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { FocusInputMode } from "@/components/FocusInputMode";
import { NavMemory } from "@/components/NavMemory";
import { RouteTransition } from "@/components/RouteTransition";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DocTalk",
  description: "Ask a PDF a question and see the page the answer came from.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-input="pointer" className={`${geistSans.variable} ${geistMono.variable} bg-[#f5f6f8]`}>
      <body className="min-h-dvh bg-[#f5f6f8] text-[#1c1e21] antialiased">
        <FocusInputMode />
        <NavMemory />
        <RouteTransition>{children}</RouteTransition>
      </body>
    </html>
  );
}

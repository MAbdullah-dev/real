import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";

import { AppProviders } from "@/providers/app-providers";

import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Estate Elite — Luxury Real Estate Marketplace",
    template: "%s · Estate Elite",
  },
  description:
    "Discover curated homes and commercial assets. Book private visits, explore premium listings, and collaborate with verified agents.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${plusJakarta.variable} h-full`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col font-sans antialiased">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}

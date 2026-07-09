import type { Metadata } from "next";
import {
  Geist,
  Geist_Mono,
  Instrument_Serif,
  JetBrains_Mono,
} from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "@/components/ui/sonner";
import { PostHogProvider } from "@/components/posthog-provider";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  weight: "400",
  style: ["normal", "italic"],
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Cracked Passport",
  description: "The lifelong passport of every Cracked Fellow.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "https://passport.crackedhq.com",
  ),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html
        lang="en"
        className={`${geist.variable} ${geistMono.variable} ${instrumentSerif.variable} ${jetbrainsMono.variable} h-full antialiased`}
      >
        <body className="min-h-full flex flex-col bg-paper text-ink">
          <PostHogProvider>{children}</PostHogProvider>
          <Toaster position="top-center" />
        </body>
      </html>
    </ClerkProvider>
  );
}

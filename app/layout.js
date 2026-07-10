import { Space_Grotesk, Inter } from "next/font/google";
import "./globals.css";
import SmoothScroll from "@/components/SmoothScroll";
import SiteSpiral from "@/components/SiteSpiral";
import Analytics from "@/components/Analytics";
import FloatingDock from "@/components/FloatingDock";
import { DevicePreviewProvider } from "@/components/DevicePreview";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata = {
  title: "NOMEN — Your Personality, Decoded",
  description:
    "A 13-point personality blueprint drawn from numerology, astrology, the Chinese zodiac and tarot — get your free preview in minutes.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <SmoothScroll />
        <SiteSpiral />
        <Analytics />
        <DevicePreviewProvider>{children}</DevicePreviewProvider>
        <FloatingDock />
      </body>
    </html>
  );
}

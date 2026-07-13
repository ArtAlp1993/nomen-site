import { Space_Grotesk, Inter, Space_Mono } from "next/font/google";
import "./globals.css";
import SmoothScroll from "@/components/SmoothScroll";
import SiteSpiral from "@/components/SiteSpiral";
import ScrollProgress from "@/components/ScrollProgress";
import SiteHeader from "@/components/SiteHeader";
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

// Моноширинный для «строгих» меток/номеров (01 · …, эйбрау) — фишка редизайна.
const spaceMono = Space_Mono({
  variable: "--font-space-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata = {
  title: "NOMEN: Your Personality, Decoded",
  description:
    "A 13-point personality blueprint from numerology, astrology, the Chinese zodiac and tarot, read from your name and birth date. Free preview in under a minute.",
};

// CSP через <meta> (статический хостинг не даёт заголовки). Главная защита —
// connect-src: даже при инъекции скрипта данные/токен нельзя слить на чужой
// хост (только на свой + Telegram + CoinGecko + Метрика). script/style с
// 'unsafe-inline' — этого требуют инлайновый бутстрап Next и стили
// framer/tailwind; blob:/data: нужны для 3D-воркеров и QR-картинки. Включаем
// только в проде, чтобы не рвать dev-HMR (websocket). Яндекс.Метрика:
// mc.yandex.ru — тег и приём хитов, mc.yandex.com/mc.webvisor.org — зеркала
// приёма данных вебвизора (ЕС-трафик ходит на webvisor.org).
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: https://mc.yandex.ru",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://mc.yandex.ru https://mc.yandex.com",
  "font-src 'self' data:",
  "connect-src 'self' https://api.telegram.org https://api.coingecko.com https://api.anthropic.com https://mc.yandex.ru https://mc.yandex.com https://mc.webvisor.org https://primary-production-6abb7.up.railway.app",
  "worker-src 'self' blob:",
  "base-uri 'none'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${inter.variable} ${spaceMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {process.env.NODE_ENV === "production" && (
          <meta httpEquiv="Content-Security-Policy" content={CSP} />
        )}
        <SmoothScroll />
        <SiteSpiral />
        <ScrollProgress />
        <SiteHeader />
        <Analytics />
        <DevicePreviewProvider>{children}</DevicePreviewProvider>
        <FloatingDock />
      </body>
    </html>
  );
}

"use client";

import { useEffect, useState } from "react";

// QR-код платёжного адреса/URI. Генерируем data-URL прямо в браузере
// (библиотека qrcode) — работает офлайн, ничего не утекает на сторонний
// сервис. Динамический импорт держит qrcode вне серверного бандла.
// errorCorrectionLevel 'H' → до ~30% площади можно перекрыть логотипом монеты
// в центре без потери читаемости.
export default function QRCode({ value, size = 200, overlay = null }) {
  const [src, setSrc] = useState("");

  useEffect(() => {
    let cancelled = false;
    if (!value) {
      setSrc("");
      return;
    }
    (async () => {
      try {
        const QR = (await import("qrcode")).default;
        const url = await QR.toDataURL(value, {
          width: size,
          margin: 1,
          errorCorrectionLevel: "H",
          color: { dark: "#0b0b12", light: "#ffffff" },
        });
        if (!cancelled) setSrc(url);
      } catch {
        if (!cancelled) setSrc("");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [value, size]);

  return (
    <div
      className="relative flex items-center justify-center overflow-hidden rounded-xl bg-white"
      style={{ width: size, height: size }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="Payment QR code" width={size} height={size} />
      ) : (
        <span className="text-xs text-black/40">…</span>
      )}
      {src && overlay && (
        <span className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-lg bg-white p-1 shadow-sm ring-1 ring-black/5">
          {overlay}
        </span>
      )}
    </div>
  );
}

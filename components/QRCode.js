"use client";

import { useEffect, useState } from "react";

// QR-код платёжного адреса/URI. Генерируем data-URL прямо в браузере
// (библиотека qrcode) — работает офлайн, ничего не утекает на сторонний
// сервис. Динамический импорт держит qrcode вне серверного бандла.
export default function QRCode({ value, size = 200 }) {
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
      className="flex items-center justify-center overflow-hidden rounded-xl bg-white"
      style={{ width: size, height: size }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="Payment QR code" width={size} height={size} />
      ) : (
        <span className="text-xs text-black/40">…</span>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";

export function DevicePreviewProvider({ children }) {
  const [mode, setMode] = useState("desktop"); // "desktop" | "mobile"
  const [url, setUrl] = useState("/");
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    setUrl(window.location.pathname + window.location.search + window.location.hash);
    // Служебный инструмент: посетителям не показываем. Включается только
    // локально или параметром ?preview в адресе; внутри iframe-превью
    // скрыт всегда, иначе получится матрёшка.
    const isEmbedded = window.self !== window.top;
    const isDev =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1" ||
      window.location.search.includes("preview");
    setEnabled(isDev && !isEmbedded);
  }, []);

  if (!enabled) {
    return children;
  }

  return (
    <>
      <div style={{ display: mode === "mobile" ? "none" : "contents" }}>
        {children}
      </div>

      {mode === "mobile" && (
        <div className="flex min-h-full items-center justify-center bg-neutral-950 py-6">
          <iframe
            title="Mobile preview"
            src={url}
            className="h-[844px] w-[390px] rounded-[2.5rem] border-8 border-neutral-800 bg-black shadow-2xl"
            onLoad={(e) => {
              // WebGL-сцены (R3F) внутри iframe меряют себя до финальной
              // раскладки и остаются 300x150 — пинаем resize, чтобы перемерили.
              const win = e.currentTarget.contentWindow;
              [300, 1000, 2500].forEach((ms) =>
                setTimeout(() => win && win.dispatchEvent(new Event("resize")), ms)
              );
            }}
          />
        </div>
      )}

      <DevicePreviewSwitcher mode={mode} setMode={setMode} />
    </>
  );
}

function DevicePreviewSwitcher({ mode, setMode }) {
  return (
    <div className="fixed bottom-4 left-4 z-[9999] flex gap-1 rounded-full border border-white/15 bg-black/80 p-1 text-xs text-white shadow-lg backdrop-blur">
      <button
        type="button"
        onClick={() => setMode("desktop")}
        className={`rounded-full px-3 py-1.5 transition-colors ${
          mode === "desktop" ? "bg-white text-black" : "hover:bg-white/10"
        }`}
      >
        Desktop
      </button>
      <button
        type="button"
        onClick={() => setMode("mobile")}
        className={`rounded-full px-3 py-1.5 transition-colors ${
          mode === "mobile" ? "bg-white text-black" : "hover:bg-white/10"
        }`}
      >
        Mobile
      </button>
    </div>
  );
}

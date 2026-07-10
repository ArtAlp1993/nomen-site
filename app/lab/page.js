"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { DEFAULT_CONFIG } from "@/components/BlueprintScene";

// Лаборатория шарика: скрытая страница (нигде не залинкована). Шарик всегда
// в центре экрана (fixed-фон), вокруг — компактные сворачиваемые панельки
// с ползунками: крутишь и сразу видишь результат. «Copy preset» → пресет
// Клоду в чат → ставим на главную.

const BlueprintScene = dynamic(() => import("@/components/BlueprintScene"), {
  ssr: false,
});

// [key, подпись, min, max, step]
const GROUPS = {
  "Лепка": [
    ["scaleX", "Длина (X)", 0.2, 3, 0.05],
    ["scaleY", "Ширина (Y)", 0.2, 3, 0.05],
    ["scaleZ", "Глубина (Z)", 0.2, 3, 0.05],
    ["zoom", "Размер", 0.3, 2.5, 0.05],
  ],
  "Форма": [
    ["fibers", "Волокна", 100, 3000, 50],
    ["pupil", "Зрачок", 0.05, 1.6, 0.01],
    ["spread", "Разлёт", 1, 5, 0.05],
    ["spreadVar", "Рваность кромки", 0, 2.5, 0.05],
    ["twist", "Закрутка", 0, 6, 0.1],
    ["depth", "Объём", 0, 3, 0.05],
  ],
  "Движение": [
    ["rotSpeed", "Скорость вращения", -0.6, 0.6, 0.01],
    ["breathe", "Дыхание", 0, 0.15, 0.005],
    ["tilt", "Покачивание", 0, 3, 0.1],
  ],
  "Свет": [
    ["opacity", "Яркость нитей", 0.1, 1, 0.02],
    ["tipSize", "Кончики", 0, 0.2, 0.005],
    ["bloom", "Свечение", 0, 3, 0.05],
  ],
};

const panelCls =
  "pointer-events-auto w-60 rounded-xl border border-foreground-muted/25 bg-background/80 backdrop-blur-md";

function Panel({ title, items, cfg, set, defaultOpen = false }) {
  return (
    <details open={defaultOpen} className={panelCls}>
      <summary className="cursor-pointer select-none px-3 py-2 font-heading text-[11px] uppercase tracking-[0.2em] text-accent-turquoise">
        {title}
      </summary>
      <div className="px-3 pb-3">
        {items.map(([key, label, min, max, step]) => (
          <label key={key} className="mb-2 block text-[11px]">
            <span className="flex justify-between text-foreground-muted">
              <span>{label}</span>
              <span className="font-mono text-foreground">{cfg[key]}</span>
            </span>
            <input
              type="range"
              min={min}
              max={max}
              step={step}
              value={cfg[key]}
              onChange={(e) => set(key, parseFloat(e.target.value))}
              className="mt-0.5 w-full accent-[#33e6e0]"
            />
          </label>
        ))}
      </div>
    </details>
  );
}

export default function LabPage() {
  const [cfg, setCfg] = useState(DEFAULT_CONFIG);
  const [copied, setCopied] = useState(false);

  const set = (key, value) => setCfg((c) => ({ ...c, [key]: value }));
  const setColor = (i, value) =>
    setCfg((c) => {
      const colors = [...c.colors];
      colors[i] = value;
      return { ...c, colors };
    });

  const copyPreset = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(cfg, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      window.prompt("Скопируй пресет вручную:", JSON.stringify(cfg));
    }
  };

  return (
    <main className="h-screen overflow-hidden">
      {/* Шарик — всегда в центре экрана, фоном */}
      <div className="fixed inset-0 z-0">
        <BlueprintScene config={cfg} accent="#33e6e0" />
      </div>

      {/* Слой управления поверх сцены; сам слой клики не ловит */}
      <div className="pointer-events-none fixed inset-0 z-10">
        {/* Верхняя строка: заголовок + кнопки */}
        <div className="pointer-events-auto absolute inset-x-0 top-0 flex flex-wrap items-center justify-between gap-2 px-4 py-3">
          <h1 className="font-heading text-sm font-semibold text-foreground/90">
            Лаборатория шарика
          </h1>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setCfg(DEFAULT_CONFIG)}
              className="rounded-full border border-foreground-muted/40 bg-background/70 px-4 py-1.5 text-xs text-foreground-muted backdrop-blur transition-colors hover:border-foreground hover:text-foreground"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={copyPreset}
              className="rounded-full bg-gradient-to-r from-accent-violet to-accent-turquoise px-4 py-1.5 text-xs font-semibold text-background"
            >
              {copied ? "Скопировано ✓" : "Copy preset"}
            </button>
          </div>
        </div>

        {/* Левый столбец: Лепка + Форма */}
        <div
          className="absolute left-3 top-14 bottom-3 flex w-60 flex-col gap-2 overflow-y-auto pr-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          data-lenis-prevent
        >
          <Panel title="Лепка" items={GROUPS["Лепка"]} cfg={cfg} set={set} defaultOpen />
          <Panel title="Форма" items={GROUPS["Форма"]} cfg={cfg} set={set} />
        </div>

        {/* Правый столбец: Движение + Свет + Цвета */}
        <div
          className="absolute right-3 top-14 bottom-3 flex w-60 flex-col items-end gap-2 overflow-y-auto pl-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          data-lenis-prevent
        >
          <Panel title="Движение" items={GROUPS["Движение"]} cfg={cfg} set={set} />
          <Panel title="Свет" items={GROUPS["Свет"]} cfg={cfg} set={set} />
          <details className={panelCls}>
            <summary className="cursor-pointer select-none px-3 py-2 font-heading text-[11px] uppercase tracking-[0.2em] text-accent-turquoise">
              Цвета
            </summary>
            <div className="px-3 pb-3">
              <div className="flex flex-wrap gap-2">
                {cfg.colors.map((c, i) => (
                  <label
                    key={i}
                    className="flex flex-col items-center gap-0.5 text-[9px] text-foreground-muted"
                  >
                    <input
                      type="color"
                      value={c}
                      onChange={(e) => setColor(i, e.target.value)}
                      className="h-8 w-10 cursor-pointer rounded border border-foreground-muted/30 bg-transparent"
                    />
                    <span className="font-mono">{c}</span>
                  </label>
                ))}
              </div>
              <p className="mt-1.5 text-[9px] text-foreground-muted">
                Последний — редкий акцент («искры»).
              </p>
            </div>
          </details>
        </div>

        {/* Подсказка снизу по центру */}
        <p className="pointer-events-none absolute inset-x-0 bottom-2 text-center text-[10px] text-foreground-muted/70">
          Крути ползунки — шарик в центре меняется вживую. Понравилось → «Copy
          preset» → пришли пресет Клоду.
        </p>
      </div>
    </main>
  );
}

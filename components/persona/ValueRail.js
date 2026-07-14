"use client";

import { useEffect, useRef, useState } from "react";

// Лента бегущих значений. Живёт ПОСТОЯННО слева от персонажа (над аурой): в покое
// медленно прокручивает возможные значения текущего пункта (числа/знаки/стихии).
// Когда пункт ищется (playKey меняется) — лента УСКОРЯЕТСЯ, «слот-машиной» находит
// ТВОЁ значение, фиксируется на нём и вызывает onLand (значок уходит в инвентарь,
// открывается окно). Только символ. Уважает prefers-reduced-motion.

const IDLE_SPEED = 0.0016; // индексов в мс — медленное фоновое «стекание»
const ITEM = 34; // высота ячейки, px (для плавного сдвига)

export default function ValueRail({ symbols, selectedIdx = 0, color, seekKey, onLand }) {
  const [pos, setPos] = useState(selectedIdx);
  const posRef = useRef(selectedIdx);
  const seekingRef = useRef(false);
  const total = symbols.length || 1;

  // Фоновый режим: медленно крутим постоянно (пока не идёт поиск).
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const loop = (now) => {
      const dt = now - last;
      last = now;
      if (!seekingRef.current) {
        posRef.current += IDLE_SPEED * dt;
        setPos(posRef.current);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Поиск: ускоряемся и садимся точно на selectedIdx, потом onLand.
  useEffect(() => {
    if (seekKey == null || symbols.length === 0) return;
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    seekingRef.current = true;
    const startPos = posRef.current;
    const loops = reduce ? 0 : 3;
    let base = Math.ceil(startPos) + loops * total;
    base += (((selectedIdx - (base % total)) % total) + total) % total; // сесть на нужный
    const startTime = performance.now();
    const DUR = reduce ? 250 : 1050;
    let raf = 0;
    const anim = (now) => {
      const t = Math.min(1, (now - startTime) / DUR);
      const e = 1 - Math.pow(1 - t, 3); // замедление к концу
      posRef.current = startPos + (base - startPos) * e;
      setPos(posRef.current);
      if (t < 1) {
        raf = requestAnimationFrame(anim);
      } else {
        posRef.current = base;
        setPos(base);
        seekingRef.current = false;
        onLand && onLand();
      }
    };
    raf = requestAnimationFrame(anim);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seekKey]);

  // Окно из 5 символов вокруг центра + плавный сдвиг по дробной части.
  const floor = Math.floor(pos);
  const frac = pos - floor;
  const rows = [-2, -1, 0, 1, 2].map((d) => {
    const i = (((floor + d) % total) + total) % total;
    return { key: `${i}-${d}`, d, s: symbols[i] };
  });

  return (
    <div
      aria-hidden="true"
      style={{
        height: ITEM * 5,
        width: 56,
        overflow: "hidden",
        position: "relative",
        maskImage: "linear-gradient(to bottom, transparent, #000 26%, #000 74%, transparent)",
        WebkitMaskImage: "linear-gradient(to bottom, transparent, #000 26%, #000 74%, transparent)",
        fontFamily: "var(--font-space-mono), ui-monospace, monospace",
      }}
    >
      <div
        style={{
          position: "absolute", left: 0, right: 0, top: 0,
          transform: `translateY(${-frac * ITEM}px)`,
          display: "flex", flexDirection: "column", alignItems: "center",
        }}
      >
        {rows.map(({ key, d, s }) => {
          const center = d === 0;
          return (
            <div
              key={key}
              style={{
                height: ITEM, display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: center ? 26 : 16,
                fontWeight: center ? 700 : 400,
                lineHeight: 1,
                color: center ? color : "#5f5c85",
                opacity: center ? 1 : 0.4 - Math.abs(d) * 0.08,
                textShadow: center ? `0 0 16px ${color}` : "none",
              }}
            >
              {s}
            </div>
          );
        })}
      </div>
    </div>
  );
}

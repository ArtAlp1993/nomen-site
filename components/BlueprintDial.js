"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { iconShapes } from "./PointIcon";
import methodology from "@/data/methodology.json";

// Композиция «шарик» (Артём 13.07, v2): внешний циферблат убран (кольцо из 13
// значков, лучи, обод и комета по ободу). Остался шарик-радужка (WebGL), на
// ~15% меньше прежнего. В его тёмном ЗРАЧКЕ поочерёдно всплывают 13 иконок
// пунктов (каждая своим цветом традиции), а вокруг зрачка по орбите кружит
// метеор с хвостом («минутная стрелка»). Чёрный фон зрачка даёт сам
// BlueprintScene (диск pupil); тут — лёгкая подложка для читаемости иконок.

const BlueprintScene = dynamic(() => import("./BlueprintScene"), {
  ssr: false,
  loading: () => null,
});

// Порядок показа иконок в зрачке: цвета традиций идут вперемешку (не кучей).
const RING_ORDER = ["A1", "A2", "B1", "A3", "A5", "C1", "A7", "A9", "D1", "A10", "A11", "C2", "A4"];
const GRP_COLOR = {
  Numerology: "#33e6e0",
  "Western Astrology": "#8f7bff",
  "Chinese Astrology": "#c07bff",
  Tarot: "#5aa9ff",
};
const LEGEND = [
  { name: "Numerology · 9", color: "#33e6e0" },
  { name: "Western astrology · 1", color: "#8f7bff" },
  { name: "Chinese astrology · 2", color: "#c07bff" },
  { name: "Tarot · 1", color: "#5aa9ff" },
];

const byCode = Object.fromEntries(methodology.map((m) => [m.code, m]));
const C = 500;        // центр svg-координат
const R_BG = 58;      // тёмная подложка под иконку (читаемость на свечении)
const R_ORBIT = 66;   // радиус орбиты метеора (по кромке зрачка)
const DUR = 8;        // период оборота метеора, c
const STEP = 1800;    // смена иконки в зрачке, мс

// Круговая орбита-направляющая метеора вокруг центра (по часовой).
const ORBIT =
  `M ${C},${C - R_ORBIT} A ${R_ORBIT},${R_ORBIT} 0 1 1 ${C},${C + R_ORBIT}` +
  ` A ${R_ORBIT},${R_ORBIT} 0 1 1 ${C},${C - R_ORBIT}`;

const ICONS = RING_ORDER.map((code) => {
  const m = byCode[code];
  return { code, title: m ? m.title : code, color: m ? GRP_COLOR[m.block] : "#33e6e0" };
});

// Хвост метеора: точки, отстающие от ядра на `lag` секунд (отрицательный begin
// = анимация уже проиграна, точка сразу на орбите — без «прыжка из угла»).
const TAIL = [
  { r: 3.4, fill: "#bff6ff", opacity: 0.5, lag: 0.12 },
  { r: 2.8, fill: "#8fe9ff", opacity: 0.34, lag: 0.26 },
  { r: 2.1, fill: "#5ad9ff", opacity: 0.2, lag: 0.42 },
];

export default function BlueprintDial({ accent, active, webglFalse }) {
  // Иконки в зрачке сменяются по очереди сами. Уважаем prefers-reduced-motion:
  // при reduce не крутим — показываем первую иконку статично.
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    const id = setInterval(() => setIdx((i) => (i + 1) % ICONS.length), STEP);
    return () => clearInterval(id);
  }, []);

  return (
    <>
      <div className="relative mx-auto aspect-square w-full max-w-[440px] sm:max-w-[720px]">
        {/* Шарик-радужка по центру, на ~15% меньше прежнего; края тают мягко. */}
        <div
          className="absolute left-1/2 top-1/2 aspect-square w-[63%] -translate-x-1/2 -translate-y-1/2"
          style={{
            maskImage: "radial-gradient(circle at 50% 50%, black 66%, transparent 90%)",
            WebkitMaskImage: "radial-gradient(circle at 50% 50%, black 66%, transparent 90%)",
          }}
        >
          {webglFalse ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src="/blueprint-still.jpg"
              alt=""
              className="h-full w-full animate-[spin_160s_linear_infinite] object-contain"
            />
          ) : active ? (
            <BlueprintScene accent={accent} />
          ) : null}
        </div>

        {/* Оверлей зрачка: иконки поочерёдно + метеор по орбите вокруг зрачка. */}
        <svg
          viewBox="0 0 1000 1000"
          role="img"
          aria-label="Your 13 points appear one by one inside the blueprint's pupil, across four traditions: numerology, western astrology, Chinese astrology and tarot."
          className="pointer-events-none absolute inset-0 h-full w-full"
        >
          {/* Орбита метеора — невидимая направляющая. */}
          <path id="pupilOrbit" d={ORBIT} fill="none" stroke="none" />

          {/* Тёмная подложка — держит чёрный центр и читаемость иконок. */}
          <circle cx={C} cy={C} r={R_BG} fill="#05040f" opacity="0.5" />

          {/* 13 иконок в центре зрачка, поочерёдно (кроссфейд 600 мс). */}
          {ICONS.map((p, i) => (
            <g
              key={p.code}
              style={{ opacity: i === idx ? 1 : 0, transition: "opacity 600ms ease" }}
            >
              <title>{p.title}</title>
              <g
                transform={`translate(${C - 36} ${C - 36}) scale(3)`}
                fill="none"
                stroke={p.color}
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ filter: `drop-shadow(0 0 5px ${p.color})` }}
              >
                {iconShapes(p.code)}
              </g>
            </g>
          ))}

          {/* Метеор: хвост → halo → ядро, по орбите вокруг зрачка. */}
          <g>
            {TAIL.map((t, k) => (
              <circle key={k} r={t.r} fill={t.fill} opacity={t.opacity}>
                <animateMotion dur={`${DUR}s`} begin={`${-(DUR - t.lag)}s`} repeatCount="indefinite">
                  <mpath href="#pupilOrbit" />
                </animateMotion>
              </circle>
            ))}
            <circle r="8" fill="#33e6e0" opacity="0.18">
              <animateMotion dur={`${DUR}s`} repeatCount="indefinite">
                <mpath href="#pupilOrbit" />
              </animateMotion>
            </circle>
            <circle r="3.6" fill="#eafcff">
              <animateMotion dur={`${DUR}s`} repeatCount="indefinite">
                <mpath href="#pupilOrbit" />
              </animateMotion>
            </circle>
          </g>
        </svg>
      </div>

      <div className="mt-6 flex flex-wrap justify-center gap-x-7 gap-y-3 font-mono text-sm tracking-wide text-foreground-muted sm:text-base">
        {LEGEND.map((l) => (
          <span key={l.name} className="inline-flex items-center gap-2.5">
            <span
              className="inline-block h-3 w-3 rounded-full"
              style={{ background: l.color, boxShadow: `0 0 10px ${l.color}` }}
            />
            {l.name}
          </span>
        ))}
      </div>
    </>
  );
}

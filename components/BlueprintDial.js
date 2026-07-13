"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { iconShapes } from "./PointIcon";
import methodology from "@/data/methodology.json";

// Композиция «шарик» (Артём 13.07): шарик-радужка (WebGL) без циферблата. В его
// тёмном ЗРАЧКЕ поочерёдно всплывают 13 иконок пунктов (цвет по традиции), при
// каждой смене расходятся волны «как камень в воду», а вокруг зрачка по орбите
// кружит метеор с хвостом.
//
// Размер и сочность НАСТРОЕНЫ РАЗДЕЛЬНО для мобилки и десктопа (Артём):
//  • десктоп «офигенный» не трогаем (zoom 0.63);
//  • на мобиле шар крупнее (почти во весь экран) — контейнер шире экрана
//    (full-bleed), край свечения уходит за экран, «плёнки» не видно;
//  • под шаром — тёмная КРУГЛАЯ подложка: аддитивные нити горят на тёмном →
//    сочно (откат прозрачного фона, но кругом, без «мёртвого квадрата»);
//  • на мобиле выше dpr — резче свечение на ретине.

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
const C = 500;              // центр svg-координат
const DUR = 8;              // период оборота метеора, c
const STEP = 1800;          // смена иконки в зрачке, мс

// Размер шара — раздельно. Десктоп не трогаем; на мобиле крупнее.
const ZOOM_DESKTOP = 0.63;
const ZOOM_MOBILE = 0.72;   // ~90vw в контейнере 124vw → зазор до края ~0.5–1 см

// Маска-круг (closest-side, не farthest-corner → без «квадрата со скруглёнными
// углами»). Тёмная КРУГЛАЯ подложка под шар: нити горят на тёмном (сочность),
// края тают в фон. На мобиле шар крупнее → тёмный круг шире.
const MASK = "radial-gradient(circle closest-side at 50% 50%, #000 60%, transparent 96%)";
const PLATE_DESKTOP = "radial-gradient(circle closest-side at 50% 50%, #05040f 58%, rgba(5,4,15,0) 85%)";
const PLATE_MOBILE = "radial-gradient(circle closest-side at 50% 50%, #05040f 80%, rgba(5,4,15,0) 100%)";

// Базовая геометрия оверлея — под десктопный zoom 0.63; на мобиле множится на
// k = zoom/0.63 (зрачок крупнее пропорционально).
const R_BG_BASE = 58;       // тёмная подложка под иконку
const R_ORBIT_BASE = 66;    // радиус орбиты метеора

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

  // Мобилку/десктоп различаем, чтобы задать разный размер шара и сочность.
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    const sync = () => setIsMobile(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const zoom = isMobile ? ZOOM_MOBILE : ZOOM_DESKTOP;
  const k = zoom / ZOOM_DESKTOP;               // масштаб оверлея под размер зрачка
  const rBg = R_BG_BASE * k;
  const rOrbit = R_ORBIT_BASE * k;
  const iconTx = (C - 36 * k).toFixed(1);      // 36 = 12 (центр 24×24) × scale 3
  const iconScale = (3 * k).toFixed(2);
  const ro = rOrbit.toFixed(1);
  const orbit = `M ${C},${(C - rOrbit).toFixed(1)} A ${ro},${ro} 0 1 1 ${C},${(C + rOrbit).toFixed(1)} A ${ro},${ro} 0 1 1 ${C},${(C - rOrbit).toFixed(1)}`;
  const plate = isMobile ? PLATE_MOBILE : PLATE_DESKTOP;

  return (
    <>
      <div
        className={
          isMobile
            ? "relative left-1/2 aspect-square w-[124vw] max-w-[560px] -translate-x-1/2"
            : "relative mx-auto aspect-square w-full max-w-[720px]"
        }
      >
        {/* Шар: canvas на весь контейнер (свечению простор), тёмная круглая
            подложка под ним (сочность), маска-круг мягко растворяет кромку. */}
        <div
          className="absolute inset-0"
          style={{ background: plate, maskImage: MASK, WebkitMaskImage: MASK }}
        >
          {webglFalse ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src="/blueprint-still.jpg"
              alt=""
              className="h-full w-full animate-[spin_160s_linear_infinite] object-contain"
              style={{ transform: `scale(${zoom})` }}
            />
          ) : active ? (
            <BlueprintScene
              accent={accent}
              // Свечение раздельно (Артём): на мобиле шире и ярче (bloom↑ +
              // порог↓ = светится больше областей → крупнее ореол); на десктопе
              // чуть убавлено (было «очень яркое» после тёмной подложки).
              config={
                isMobile
                  ? { zoom, bloom: 1.6, bloomThreshold: 0.1 }
                  : { zoom, bloom: 1.0 }
              }
              dpr={isMobile ? [1, 2] : undefined}
            />
          ) : null}
        </div>

        {/* Оверлей зрачка: волны + иконки поочерёдно + метеор по орбите. */}
        <svg
          viewBox="0 0 1000 1000"
          role="img"
          aria-label="Your 13 points appear one by one inside the blueprint's pupil, across four traditions: numerology, western astrology, Chinese astrology and tarot."
          className="pointer-events-none absolute inset-0 h-full w-full"
        >
          {/* Орбита метеора — невидимая направляющая. */}
          <path id="pupilOrbit" d={orbit} fill="none" stroke="none" />

          {/* Тёмная подложка — держит чёрный центр и читаемость иконок. */}
          <circle cx={C} cy={C} r={rBg.toFixed(1)} fill="#05040f" opacity="0.5" />

          {/* Волны от значка при каждом переключении (круги от камня в воде):
              key={idx} → React перемонтирует группу на смену иконки, и SMIL
              (begin=0, без repeat) проигрывается заново. */}
          <g key={`ripple-${idx}`}>
            {[0, 1, 2].map((w) => (
              <circle key={w} cx={C} cy={C} fill="none" stroke={ICONS[idx].color} opacity="0">
                <animate
                  attributeName="r"
                  values={`${(rBg - 4).toFixed(1)};${(rBg + 170 * k).toFixed(1)}`}
                  dur="1.7s"
                  begin={`${w * 0.24}s`}
                  fill="freeze"
                />
                <animate attributeName="opacity" values="0.5;0" dur="1.7s" begin={`${w * 0.24}s`} fill="freeze" />
                <animate
                  attributeName="stroke-width"
                  values={`${(3 * k).toFixed(1)};0.4`}
                  dur="1.7s"
                  begin={`${w * 0.24}s`}
                  fill="freeze"
                />
              </circle>
            ))}
          </g>

          {/* 13 иконок в центре зрачка, поочерёдно (кроссфейд 600 мс). */}
          {ICONS.map((p, i) => (
            <g
              key={p.code}
              style={{ opacity: i === idx ? 1 : 0, transition: "opacity 600ms ease" }}
            >
              <title>{p.title}</title>
              <g
                transform={`translate(${iconTx} ${iconTx}) scale(${iconScale})`}
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
            {TAIL.map((t, w) => (
              <circle key={w} r={(t.r * k).toFixed(1)} fill={t.fill} opacity={t.opacity}>
                <animateMotion dur={`${DUR}s`} begin={`${-(DUR - t.lag)}s`} repeatCount="indefinite">
                  <mpath href="#pupilOrbit" />
                </animateMotion>
              </circle>
            ))}
            <circle r={(8 * k).toFixed(1)} fill="#33e6e0" opacity="0.18">
              <animateMotion dur={`${DUR}s`} repeatCount="indefinite">
                <mpath href="#pupilOrbit" />
              </animateMotion>
            </circle>
            <circle r={(3.6 * k).toFixed(1)} fill="#eafcff">
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

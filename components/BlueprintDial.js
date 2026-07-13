"use client";

import dynamic from "next/dynamic";
import { iconShapes } from "./PointIcon";
import methodology from "@/data/methodology.json";

// Единая композиция-«циферблат» (Артём 13.07): наш шарик-радужка (крупный) в
// центре, вокруг него — кольцо из 13 пунктов почти вплотную, каждый своим
// значком из продукта (PointIcon) и цветом традиции; «YOU» в зрачке. Значки
// НЕ мигают сами по себе — вспыхивают («пих»), когда мимо пробегает комета-
// стрелка по ободу (SMIL, синхронно). Названия — в панелях ниже.

const BlueprintScene = dynamic(() => import("./BlueprintScene"), {
  ssr: false,
  loading: () => null,
});

// Цветные традиции (B/C/D) намеренно разбросаны между нумерологией (зелёные),
// чтобы цвета шли по кругу вперемешку, а не кучей.
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
const R_DOT = 312;    // радиус кольца делений (значки почти у кромки шарика)
const R_RAY0 = 268;   // короткий луч от кромки шарика к делению
const ICON_R = 38;    // радиус кружка-деления
const DUR = 20;       // период кометы, c

const PTS = RING_ORDER.map((code, i) => {
  const a = (-90 + (i * 360) / RING_ORDER.length) * (Math.PI / 180);
  const cos = Math.cos(a), sin = Math.sin(a);
  const m = byCode[code];
  // Момент, когда комета добегает до этого деления (комета стартует с верхней
  // точки), минус небольшой лид, чтобы пик вспышки совпал с проходом.
  const begin = (DUR * i) / RING_ORDER.length - 0.4;
  return {
    code,
    title: m ? m.title : code,
    color: m ? GRP_COLOR[m.block] : "#33e6e0",
    x: C + R_DOT * cos,
    y: C + R_DOT * sin,
    rx0: C + R_RAY0 * cos,
    ry0: C + R_RAY0 * sin,
    begin: begin.toFixed(2),
  };
});
const RING_PATH =
  PTS.map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ") + " Z";

export default function BlueprintDial({ accent, active, webglFalse }) {
  return (
    <>
      <div className="relative mx-auto aspect-square w-full max-w-[540px] sm:max-w-[720px]">
        {/* Шарик-радужка по центру, крупный; края тают в кольцо. */}
        <div
          className="absolute left-1/2 top-1/2 aspect-square w-[74%] -translate-x-1/2 -translate-y-1/2"
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

        {/* Циферблат: лучи + обод + комета-стрелка + 13 значков-делений. */}
        <svg
          viewBox="0 0 1000 1000"
          role="img"
          aria-label="A dial of your 13 points around the blueprint, grouped into four traditions: numerology, western astrology, Chinese astrology and tarot."
          className="pointer-events-none absolute inset-0 h-full w-full"
        >
          <g stroke="rgba(166,160,198,0.13)" strokeWidth="1">
            {PTS.map((p) => (
              <line key={p.code} x1={p.rx0} y1={p.ry0} x2={p.x} y2={p.y} />
            ))}
          </g>

          <path id="dialRing" d={RING_PATH} fill="none" stroke="rgba(166,160,198,0.2)" strokeWidth="1.5" />

          {/* Комета-стрелка бежит по ободу. */}
          <g className="nomen-comet">
            <circle r="10" fill="#33e6e0" opacity="0.16">
              <animateMotion dur={`${DUR}s`} repeatCount="indefinite">
                <mpath href="#dialRing" />
              </animateMotion>
            </circle>
            <circle r="4" fill="#eafcff">
              <animateMotion dur={`${DUR}s`} repeatCount="indefinite">
                <mpath href="#dialRing" />
              </animateMotion>
            </circle>
          </g>

          {PTS.map((p) => (
            <g key={p.code}>
              <title>{p.title}</title>
              {/* Вспышка-«пих» при проходе кометы (синхронно, не постоянный пульс). */}
              <circle cx={p.x} cy={p.y} r={ICON_R} fill={p.color} opacity="0" className="node-flash">
                <animate
                  attributeName="opacity"
                  dur={`${DUR}s`}
                  begin={`${p.begin}s`}
                  repeatCount="indefinite"
                  keyTimes="0;0.02;0.06;1"
                  values="0;0.85;0;0"
                />
                <animate
                  attributeName="r"
                  dur={`${DUR}s`}
                  begin={`${p.begin}s`}
                  repeatCount="indefinite"
                  keyTimes="0;0.02;0.06;1"
                  values={`${ICON_R};${ICON_R + 14};${ICON_R};${ICON_R}`}
                />
              </circle>
              <circle cx={p.x} cy={p.y} r={ICON_R} fill="#05040f" opacity="0.72" />
              <circle cx={p.x} cy={p.y} r={ICON_R} fill="none" stroke={p.color} strokeOpacity="0.6" strokeWidth="2" />
              {/* Значок крупнее и заметнее (scale 1.5 от базовых 24×24). */}
              <g
                transform={`translate(${(p.x - 18).toFixed(1)} ${(p.y - 18).toFixed(1)}) scale(1.5)`}
                fill="none"
                stroke={p.color}
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {iconShapes(p.code)}
              </g>
            </g>
          ))}
        </svg>

        {/* «YOU» в зрачке шарика. */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span
            className="font-mono text-[11px] tracking-[0.35em] text-foreground/90 sm:text-xs"
            style={{ textShadow: "0 0 8px rgba(5,4,15,0.95), 0 0 16px rgba(5,4,15,0.85)" }}
          >
            YOU
          </span>
        </div>
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

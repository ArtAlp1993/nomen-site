"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import SectionHeading from "./ui/SectionHeading";
import PointIcon from "./PointIcon";
import { useResult } from "./ResultProvider";
import methodology from "@/data/methodology.json";

// 3D-сцена рендерится только на клиенте (WebGL) — иначе SSR падает.
const BlueprintScene = dynamic(() => import("./BlueprintScene"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center text-sm text-foreground-muted">
      Loading blueprint…
    </div>
  ),
});

// 4 категории традиций — каждая своим цветом (в космической палитре).
const CATEGORY_COLOR = {
  Numerology: "#33e6e0",
  "Western Astrology": "#6c4ff6",
  "Chinese Astrology": "#c07bff",
  Tarot: "#5aa9ff",
};
const BLOCK_ORDER = ["Numerology", "Western Astrology", "Chinese Astrology", "Tarot"];

export default function MethodologyDiagram() {
  const { result } = useResult();
  const labels = {};
  if (result?.points) {
    for (const p of result.points) {
      labels[p.code] = p.label;
    }
  }
  const personalized = Boolean(result?.points?.length);

  // Авто-цикл категорий: радужка мягко перекрашивается, легенда подсвечивает
  // активную традицию. Живёт сама, без взаимодействия.
  const [activeBlock, setActiveBlock] = useState(0);
  useEffect(() => {
    const id = setInterval(
      () => setActiveBlock((i) => (i + 1) % BLOCK_ORDER.length),
      3600
    );
    return () => clearInterval(id);
  }, []);
  const accent = CATEGORY_COLOR[BLOCK_ORDER[activeBlock]];

  return (
    <section className="mx-auto max-w-5xl px-6 py-24 sm:py-32">
      <SectionHeading
        eyebrow="The methodology"
        title={personalized ? "Your Blueprint, mapped" : "Your Blueprint of Potential"}
        subtitle="Thirteen points across four traditions — every one read from your name and the day you were born."
      />

      {/* Сцена без «рамки»: широкое поле уходит под заголовок и растворяется
          по краям радиальной маской — радужка выше спирали, ниже текста. */}
      <div className="-mt-6 flex justify-center">
        <div
          className="relative h-[360px] w-full max-w-4xl sm:h-[660px]"
          role="img"
          aria-label="A living blueprint: a luminous iris of light fibres, tinted by four traditions — numerology, astrology, Chinese astrology and tarot."
          style={{
            maskImage:
              "radial-gradient(ellipse 62% 56% at 50% 50%, black 50%, transparent 76%)",
            WebkitMaskImage:
              "radial-gradient(ellipse 62% 56% at 50% 50%, black 50%, transparent 76%)",
          }}
        >
          <BlueprintScene accent={accent} />
        </div>
      </div>

      {/* Пункты по традициям, симметрично по центру: Numerology во всю ширину
          (9 пунктов в три колонки), ниже — три традиции в ряд. Иконки
          временные, под замену на сигилы (2026-07-10_дизайн-иконок-13-пунктов.md). */}
      <div className="mx-auto mt-10 grid max-w-4xl gap-4">
        {(() => {
          const panel =
            "rounded-xl border border-foreground-muted/30 bg-background-alt/40 p-6";
          const renderPanel = (block, wide) => {
            const items = methodology.filter((p) => p.block === block);
            const color = CATEGORY_COLOR[block];
            return (
              <div key={block} className={`${panel} flex flex-col items-center`}>
                <h3
                  className="text-center font-heading text-xs uppercase tracking-[0.2em]"
                  style={{ color }}
                >
                  {block}
                </h3>
                <ul
                  className={`mt-4 gap-x-8 gap-y-3 text-sm text-foreground-muted ${
                    wide
                      ? "grid sm:grid-cols-3 justify-center"
                      : "flex flex-col items-center"
                  }`}
                >
                  {items.map((p) => (
                    <li key={p.code} className="flex items-start gap-2.5">
                      <span className="mt-0.5 shrink-0" style={{ color }}>
                        <PointIcon code={p.code} size={17} />
                      </span>
                      <span className={wide ? "max-w-[10rem]" : ""}>
                        {labels[p.code] ? (
                          <span className="text-foreground">{labels[p.code]}</span>
                        ) : (
                          p.title
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          };
          return (
            <>
              {renderPanel("Numerology", true)}
              <div className="grid gap-4 sm:grid-cols-3">
                {["Western Astrology", "Chinese Astrology", "Tarot"].map((b) =>
                  renderPanel(b, false)
                )}
              </div>
            </>
          );
        })()}
      </div>
    </section>
  );
}

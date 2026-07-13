"use client";

import { useEffect, useRef, useState } from "react";
import SectionHeading from "./ui/SectionHeading";
import BlueprintDial from "./BlueprintDial";
import InfoPopover from "./InfoPopover";
import PointIcon from "./PointIcon";
import { useResult } from "./ResultProvider";
import methodology from "@/data/methodology.json";

// 4 категории традиций — каждая своим цветом (в космической палитре).
const CATEGORY_COLOR = {
  Numerology: "#33e6e0",
  "Western Astrology": "#6c4ff6",
  "Chinese Astrology": "#c07bff",
  Tarot: "#5aa9ff",
};
const BLOCK_ORDER = ["Numerology", "Western Astrology", "Chinese Astrology", "Tarot"];

// Тексты попапов «какую боль закрывает пункт» (copywriting + humanizer).
const POINT_PAIN = {
  A1: "Ever feel like you keep circling the same lesson? Your Life Path is the one you were set up to work on, and it tells you what your life is really about.",
  A2: "Not sure what your natural edge is? Your Birthday Number points to the one talent you got for free.",
  A3: "Wondering what you are actually here to build? Your Expression is the work you grow into over a lifetime.",
  A4: "Chasing things that never quite satisfy? Your Soul Urge shows what you secretly want under all of it.",
  A5: "Tired of being read wrong? Your Personality is the first impression you hand people before they know you.",
  A7: "Worried about where your life is heading? Your Maturity Number shows who you settle into after about 40.",
  A9: "Keep tripping over the same problem? This names the skill you never built, and the strength you can lean on instead.",
  A10: "Want your strong and weak spots on one page? The Square lays out nine core traits so you can see them at a glance.",
  A11: "Feel like you are paying off something you did not sign up for? Karmic Debt names the old lesson you brought in with you.",
  B1: "Not sure who you are underneath the roles? Your Sun Sign is your core drive, the part of you that wants to shine.",
  C1: "Want to know how you come across before you say a word? Your animal is your gut-level temperament.",
  C2: "Two people, same sign, a totally different feel? Your Year Element sets the temperature of yours.",
  D1: "Curious what your life keeps rhyming with? Your Birth Card is the archetype your story runs on.",
};

export default function MethodologyDiagram() {
  const { result } = useResult();
  // Персональные значения: открыто показываем только избранные (featured) —
  // те же, что раскрыты в тизере. Остальные значения — под блюром: их
  // толкование живёт в платном разборе (иначе пейвол обходится этим блоком).
  const labels = {};
  if (result?.points) {
    for (const p of result.points) {
      labels[p.code] = { label: p.label, featured: !!p.featured };
    }
  }
  const personalized = Boolean(result?.points?.length);

  // Scroll-peek (З-81): когда клиент доскроллил до нижнего блока пунктов,
  // заблюренные значения на 1 секунду приоткрываются и снова гаснут — «подкрался,
  // подсмотрел, закрылось». Срабатывает при каждом входе блока в зону видимости.
  const pointsRef = useRef(null);
  const [lowerPeek, setLowerPeek] = useState(false);
  useEffect(() => {
    if (!personalized) return;
    const el = pointsRef.current;
    if (!el) return;
    let timer;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setLowerPeek(true);
          clearTimeout(timer);
          timer = setTimeout(() => setLowerPeek(false), 1000);
        }
      },
      { threshold: 0.35 }
    );
    obs.observe(el);
    return () => {
      clearTimeout(timer);
      obs.disconnect();
    };
  }, [personalized]);

  // WebGL бывает недоступен (выключено аппаратное ускорение, сбой GPU,
  // старые машины) — тогда вместо живой сцены показываем её кадр
  // (public/blueprint-still.jpg) с медленным вращением.
  const [webgl, setWebgl] = useState(null);
  useEffect(() => {
    try {
      const probe = document.createElement("canvas");
      setWebgl(!!(probe.getContext("webgl2") || probe.getContext("webgl")));
    } catch {
      setWebgl(false);
    }
  }, []);

  // Перф (13.07): WebGL-сцена (three.js + Bloom) монтируется только когда её
  // контейнер рядом с вьюпортом. На hero и в футере r3f-петля не крутится и не
  // отъедает кадровый бюджет скролла. Запас rootMargin монтирует заранее, чтобы
  // к появлению сцена уже была готова (без пустого места и вспышки Loading).
  const sceneRef = useRef(null);
  const [sceneNear, setSceneNear] = useState(false);
  useEffect(() => {
    const el = sceneRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => setSceneNear(entry.isIntersecting),
      { rootMargin: "300px 0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

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
    <section className="mx-auto max-w-5xl px-6 pt-16 pb-24 sm:py-32">
      <SectionHeading
        eyebrow="The methodology"
        title={personalized ? "Your Blueprint, mapped" : "Your Blueprint of Potential"}
        subtitle="Thirteen points across four traditions, every one read from your name and the day you were born."
      />

      {/* Шарик-радужка (Артём 13.07, v2): циферблат убран; иконки 13 пунктов
          всплывают поочерёдно в зрачке, метеор кружит по орбите вокруг зрачка.
          sceneRef — пауза WebGL вне вьюпорта. -mx-6/overflow-x-clip: на мобиле
          шар full-bleed (контейнер 124vw шире экрана — свечению простор за
          краями); overflow-x-clip срезает лишнее без горизонтального скролла. */}
      <div ref={sceneRef} className="mt-4 -mx-6 overflow-x-clip sm:mx-0">
        <BlueprintDial
          accent={accent}
          active={sceneNear && webgl === true}
          webglFalse={webgl === false}
        />
      </div>

      {/* Пункты по традициям, симметрично по центру: Numerology во всю ширину
          (9 пунктов в три колонки), ниже — три традиции в ряд. Иконки
          временные, под замену на сигилы (2026-07-10_дизайн-иконок-13-пунктов.md). */}
      <div ref={pointsRef} className="mx-auto mt-10 grid max-w-4xl gap-4">
        {(() => {
          const panel =
            "rounded-xl border border-foreground-muted/30 bg-background-alt/75 backdrop-blur-md p-6 transition-all duration-500 ease-out hover:border-accent-turquoise/50 hover:shadow-[0_0_44px_-22px_rgba(51,230,224,0.55)]";
          const renderPanel = (block, wide) => {
            const items = methodology.filter((p) => p.block === block);
            const color = CATEGORY_COLOR[block];
            return (
              <div
                key={block}
                className={`${panel} flex flex-col items-center`}
              >
                <h3
                  className="self-center text-center font-heading text-xs uppercase tracking-[0.2em]"
                  style={{ color }}
                >
                  {block}
                </h3>
                {/* Мобильные — «таблетки» по центру (ровно при любой длине
                    текста); от sm — прежняя десктопная раскладка списками. */}
                <ul
                  className={`mt-4 flex flex-wrap justify-center gap-2 text-sm text-foreground-muted sm:gap-x-8 sm:gap-y-3 ${
                    wide
                      ? "sm:grid sm:grid-cols-3 sm:justify-center"
                      : "sm:flex sm:flex-col sm:items-start"
                  }`}
                >
                  {items.map((p) => (
                    <li
                      key={p.code}
                      className="flex items-center gap-2 rounded-full border border-foreground-muted/25 bg-background-alt/60 px-3 py-1.5 transition-colors duration-300 hover:text-accent-turquoise sm:items-start sm:gap-2.5 sm:rounded-none sm:border-0 sm:bg-transparent sm:px-0 sm:py-0"
                    >
                      <span className="shrink-0 sm:mt-0.5" style={{ color }}>
                        <PointIcon code={p.code} size={17} />
                      </span>
                      {/* Кликабельно само название пункта → попап «какую боль
                          закрывает». Отдельный кружок-ⓘ не нужен: подсветка
                          названия при наведении и есть сигнал кликабельности. */}
                      <InfoPopover
                        title={p.title}
                        eyebrow={block}
                        trigger={
                          <span className={wide ? "sm:max-w-[10rem]" : ""}>
                            {(() => {
                              const entry = labels[p.code];
                              const text = entry ? entry.label : p.title;
                              // Демо-страница до квиза: название пункта открыто
                              // (нечего скрывать — значений ещё нет).
                              if (!personalized) {
                                return <span>{text}</span>;
                              }
                              // Квиз пройден: нижний блок под глазом — цельная
                              // «запертая карта». Заблюрено ВСЁ (включая бесплатную
                              // четвёрку — её уже показали наверху в тизере), при
                              // доскролле весь блок приоткрывается на секунду.
                              return (
                                <span
                                  className={`select-none text-foreground transition-all duration-500 ${
                                    lowerPeek
                                      ? "opacity-100 blur-0"
                                      : "opacity-70 blur-[5px]"
                                  }`}
                                  aria-hidden={!lowerPeek}
                                >
                                  {text}
                                </span>
                              );
                            })()}
                          </span>
                        }
                      >
                        {POINT_PAIN[p.code]}
                      </InfoPopover>
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

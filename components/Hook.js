"use client";

import { useEffect, useRef } from "react";

// «Караоке» (фишка редизайна): слова приглушены и загораются по мере прокрутки.
// ПЕРФ: без React-setState на каждый кадр (он ре-рендерил все слова и давал
// «ступени»/тормоза при скролле). Держим refs на слова и в rAF меняем opacity
// НАПРЯМУЮ в DOM — только у изменившихся слов. Плавность — CSS-transition.
const PARTS = [
  { t: "Your name carries a number. Your birth date carries a pattern. Together they sketch" },
  { t: "the map that's already running your life.", accent: true },
  { t: "We just read it out loud." },
];

const WORDS = PARTS.flatMap((p) =>
  p.t.split(" ").map((w) => ({ w, accent: !!p.accent }))
);

export default function Hook() {
  const pRef = useRef(null);
  const spanRefs = useRef([]);
  const litRef = useRef(-1);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      spanRefs.current.forEach((s) => s && (s.style.opacity = "1"));
      return undefined;
    }
    let raf = 0;
    const apply = (lit) => {
      if (lit === litRef.current) return;
      // Обновляем opacity только у слов в диапазоне изменения — не все подряд.
      const prev = litRef.current < 0 ? 0 : litRef.current;
      const from = Math.max(0, Math.min(prev, lit));
      const to = Math.min(WORDS.length - 1, Math.max(prev, lit));
      for (let i = from; i <= to; i++) {
        const s = spanRefs.current[i];
        if (s) s.style.opacity = i < lit ? "1" : "0.16";
      }
      litRef.current = lit;
    };
    const update = () => {
      raf = 0;
      const el = pRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const prog = Math.max(
        0,
        Math.min(1, (vh * 0.82 - rect.top) / (rect.height + vh * 0.45))
      );
      apply(Math.floor(prog * (WORDS.length + 2)));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    update();
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section className="mx-auto max-w-3xl px-6 pt-7 pb-14 text-center sm:py-32">
      <p
        ref={pRef}
        className="readable-on-spiral font-heading text-xl font-semibold leading-snug sm:text-3xl md:text-4xl"
      >
        {WORDS.map((wd, i) => (
          <span
            key={i}
            ref={(el) => {
              spanRefs.current[i] = el;
            }}
            className="transition-opacity duration-500 ease-out"
            style={{
              opacity: 0.16,
              color: wd.accent ? "var(--color-accent-turquoise)" : undefined,
            }}
          >
            {wd.w}{" "}
          </span>
        ))}
      </p>
    </section>
  );
}

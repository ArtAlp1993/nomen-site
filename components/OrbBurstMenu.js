"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useResult } from "./ResultProvider";
import Button from "./ui/Button";

// Пасхалка hero-шарика: дотапал → «взрыв» (CosmicScene шлёт nomen-orb-explode).
// Здесь ловим событие → белая вспышка ~1с → всплывает меню-призыв. Контекст:
//  1) квиз не пройден → зовём пройти тест (+ скидка 10% за секрет);
//  2) квиз пройден, но заказ НЕ оформлен → зовём к оплате (+ скидка);
//  3) квиз пройден И видел подтверждение заказа (датчик nomen-ordered) →
//     ничего не навязываем, просто «спасибо».
// Всё через портал в body (иначе backdrop-blur/transform предков ломают fixed).
const DISCOUNT_CODE = "CODED10";
const DISCOUNT_KEY = "nomen-egg-discount";
const ORDERED_KEY = "nomen-ordered";

export default function OrbBurstMenu() {
  const { result } = useResult();
  const [flash, setFlash] = useState(false);
  const [menu, setMenu] = useState(false);
  const [ordered, setOrdered] = useState(false);
  const [copied, setCopied] = useState(false);
  const timers = useRef([]);

  useEffect(() => {
    const clearAll = () => {
      timers.current.forEach(clearTimeout);
      timers.current = [];
    };
    const onExplode = () => {
      clearAll();
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      let didOrder = false;
      try {
        didOrder = !!localStorage.getItem(ORDERED_KEY);
      } catch {
        /* storage недоступен */
      }
      setOrdered(didOrder);
      // Секрет найден → сохраняем право на скидку (кроме уже оформивших заказ).
      if (!didOrder) {
        try {
          localStorage.setItem(DISCOUNT_KEY, DISCOUNT_CODE);
        } catch {
          /* не критично */
        }
      }
      setFlash(true);
      setMenu(false);
      timers.current.push(setTimeout(() => setFlash(false), reduce ? 150 : 1000));
      timers.current.push(setTimeout(() => setMenu(true), reduce ? 200 : 1000));
    };
    window.addEventListener("nomen-orb-explode", onExplode);
    return () => {
      window.removeEventListener("nomen-orb-explode", onExplode);
      clearAll();
    };
  }, []);

  useEffect(() => {
    if (!menu) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") setMenu(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menu]);

  const done = !!(result && result.points && result.points.length);
  const first = (result?.firstName || "").trim();

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(DISCOUNT_CODE);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard недоступен — код и так виден для ручного копирования */
    }
  };

  const goTo = (id) => {
    setMenu(false);
    const el = document.querySelector(id);
    if (typeof window !== "undefined" && window.__lenis && el) {
      window.__lenis.scrollTo(el, { offset: -20 });
    } else if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  if (typeof document === "undefined") return null;

  // Состояние 3: уже оформил заказ — просто благодарим, без призывов и скидки.
  const settled = done && ordered;

  return createPortal(
    <>
      {flash && (
        <div
          aria-hidden
          className="nomen-flash pointer-events-none fixed inset-0 z-[90] bg-white"
          style={{ animation: "nomenFlash 1s ease-out forwards" }}
        />
      )}

      {menu && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center px-6"
          onClick={() => setMenu(false)}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
            className="nomen-pop relative w-full max-w-md rounded-2xl border border-accent-turquoise/40 bg-background-alt p-8 text-center shadow-2xl"
            style={{ animation: "nomenPopIn 0.35s ease-out" }}
          >
            <button
              type="button"
              aria-label="Close"
              onClick={() => setMenu(false)}
              className="absolute right-3 top-2 text-2xl leading-none text-foreground-muted transition-colors hover:text-foreground"
            >
              ×
            </button>

            <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-accent-turquoise">
              You found the hidden one
            </p>

            {settled ? (
              // Уже оформил заказ — благодарим, ничего не навязываем.
              <>
                <h3 className="mt-3 font-heading text-2xl font-semibold">
                  {first ? `Nicely done, ${first}` : "Nicely done"}
                </h3>
                <p className="mt-3 text-sm text-foreground-muted">
                  Your reading is already on its way. Thanks for digging around.
                </p>
                <div className="mt-6 flex justify-center">
                  <button
                    type="button"
                    onClick={() => setMenu(false)}
                    className="text-sm text-foreground-muted underline-offset-4 transition-colors hover:text-foreground hover:underline"
                  >
                    Close
                  </button>
                </div>
              </>
            ) : (
              <>
                {done ? (
                  <h3 className="mt-3 font-heading text-2xl font-semibold">
                    {first ? `${first}, the rest is one step away` : "The rest is one step away"}
                  </h3>
                ) : (
                  <h3 className="mt-3 font-heading text-2xl font-semibold">
                    Now read what is inside
                  </h3>
                )}

                <p className="mt-3 text-sm text-foreground-muted">
                  {done
                    ? "You already saw a real slice. Your full 13-point reading is ready when you are."
                    : "You just set your own blueprint going. See a real slice of it, free, in under a minute."}
                </p>

                {/* Награда за секрет: скидка 10% + промокод. */}
                <div className="mt-6 rounded-xl border border-accent-turquoise/30 bg-accent-turquoise/[0.06] px-4 py-3">
                  <p className="text-sm text-foreground">
                    Secret unlocked:{" "}
                    <span className="font-semibold text-accent-turquoise">10% off</span> your reading.
                  </p>
                  <div className="mt-2 flex items-center justify-center gap-3">
                    <span className="font-mono text-sm tracking-[0.2em] text-accent-turquoise">
                      {DISCOUNT_CODE}
                    </span>
                    <button
                      type="button"
                      onClick={copyCode}
                      className="rounded-full border border-accent-turquoise/40 px-3 py-1 font-mono text-[11px] uppercase tracking-wider text-accent-turquoise transition-colors hover:bg-accent-turquoise/10"
                    >
                      {copied ? "Copied" : "Copy"}
                    </button>
                  </div>
                </div>

                <div className="mt-6 flex flex-col items-center gap-3">
                  {done ? (
                    <Button onClick={() => goTo("#pricing")}>Unlock my full reading</Button>
                  ) : (
                    <Button onClick={() => goTo("#quiz")}>Reveal my blueprint</Button>
                  )}
                  <button
                    type="button"
                    onClick={() => setMenu(false)}
                    className="text-sm text-foreground-muted underline-offset-4 transition-colors hover:text-foreground hover:underline"
                  >
                    Maybe later
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>,
    document.body
  );
}

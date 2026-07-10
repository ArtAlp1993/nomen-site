"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";

// Моргание «глаза»: два века цвета фона поверх сцены-радужки изредка
// смыкаются и раскрываются. Лежит внутри контейнера с эллиптической маской
// сцены, поэтому веки обрезаются по форме глаза автоматически. Чистый CSS
// transform — WebGL-сцену не трогаем. При prefers-reduced-motion не моргаем.
//
// Ритм: пауза 4–9 сек → быстрое смыкание (~90мс) → раскрытие (~220мс);
// в ~25% случаев двойное моргание, как у живого глаза.

export default function EyeBlink() {
  const reduce = useReducedMotion();
  const [closed, setClosed] = useState(false);
  const timers = useRef([]);

  useEffect(() => {
    if (reduce) return;
    let alive = true;
    const later = (fn, ms) => {
      const id = setTimeout(fn, ms);
      timers.current.push(id);
      return id;
    };
    const blinkOnce = (after) =>
      new Promise((done) => {
        later(() => {
          if (!alive) return;
          setClosed(true);
          later(() => {
            if (!alive) return;
            setClosed(false);
            done();
          }, 110);
        }, after);
      });
    const cycle = async () => {
      while (alive) {
        const pause = 4000 + Math.random() * 5000;
        await blinkOnce(pause);
        if (Math.random() < 0.25) await blinkOnce(260); // двойное моргание
      }
    };
    cycle();
    return () => {
      alive = false;
      timers.current.forEach(clearTimeout);
      timers.current = [];
    };
  }, [reduce]);

  const lid =
    "pointer-events-none absolute inset-x-0 h-[52%] bg-background transition-transform";
  const speed = closed
    ? "duration-[90ms] ease-in" // смыкаются быстро
    : "duration-[220ms] ease-out"; // раскрываются мягче

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div
        className={`${lid} ${speed} top-0`}
        style={{ transform: closed ? "translateY(0)" : "translateY(-101%)" }}
      />
      <div
        className={`${lid} ${speed} bottom-0`}
        style={{ transform: closed ? "translateY(0)" : "translateY(101%)" }}
      />
    </div>
  );
}

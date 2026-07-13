"use client";

import { useEffect, useRef } from "react";

// Тонкая полоса-прогресс прокрутки сверху (фишка редизайна). ПЕРФ: без
// React-setState на каждый кадр — двигаем полосу через scaleX НАПРЯМУЮ в DOM
// (GPU), один пассивный scroll-слушатель с rAF-троттлингом.
export default function ScrollProgress() {
  const barRef = useRef(null);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(1, (window.scrollY || 0) / max) : 0;
      if (barRef.current) barRef.current.style.transform = `scaleX(${p})`;
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
    <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-0.5">
      <div
        ref={barRef}
        className="h-full origin-left bg-gradient-to-r from-accent-violet to-accent-turquoise"
        style={{ transform: "scaleX(0)" }}
      />
    </div>
  );
}
